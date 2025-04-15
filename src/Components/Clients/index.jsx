import React, { useEffect, useState } from "react";
import AddClientForm from "./AddClient";
import EditClientForm from "./EditClient"; // We'll create this component
import instance from "../../API/instance";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Checkbox } from "@mui/material";
import * as XLSX from "xlsx-js-style";
import { ConfirmDialog } from "../ConfirmDialog"; // For delete confirmation
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

const Clients = () => {
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [message, setMessage] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const response = await instance.get("/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    [
      client.name,
      client.identityNumber,
      client.phone,
      client.nationality,
      client.boardingLocation,
    ].some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const closeModal = () => {
    setShowForm(false);
    fetchClients();
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    fetchClients();
  };

  const handleCardClick = (clientId) => {
    navigate(`/client/${clientId}`);
  };

  const handleSelectClient = (phone) => {
    setSelectedClients((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  // Handle edit button click
  const handleEditClick = (client, e) => {
    e.stopPropagation();
    setCurrentClient(client);
    setShowEditForm(true);
  };

  // Handle delete button click
  const handleDeleteClick = (clientId, e) => {
    e.stopPropagation();
    setClientToDelete(clientId);
    setConfirmOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      await instance.delete(`/clients/${clientToDelete}`);
      toast.success("تم حذف العميل بنجاح");
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setConfirmOpen(false);
      setClientToDelete(null);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedClients.length || !message) {
      alert("Please select clients and enter a message.");
      return;
    }

    try {
      let response;
      if (selectedClients.length === 1) {
        // Send a single WhatsApp message
        response = await instance.post("/clients/send-whatsapp", {
          phone: selectedClients[0],
          message,
        });
      } else {
        // Send bulk WhatsApp messages
        response = await instance.post("/clients/send-bulk-whatsapp", {
          phones: selectedClients,
          message,
        });
      }

      if (response.data.success) {
        alert(response.data.message); // Show success message
      } else {
        throw new Error("Failed to send messages via WhatsApp.");
      }
    } catch (error) {
      console.error("Error sending WhatsApp messages:", error.message);
      alert("Failed to send messages. Falling back to WhatsApp Web...");

      // Fallback to WhatsApp Web
      selectedClients.forEach((phone, index) => {
        setTimeout(() => {
          const whatsappLink = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
            message
          )}`;
          window.open(whatsappLink, "_blank");
        }, index * 1000); // Delay each window opening by 1 second
      });
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await instance.post("/clients/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success) {
        alert("File uploaded successfully!");
        fetchClients(); // Refresh clients list
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    }
  };

  const exportClientsToExcel = () => {
    const data = [];

    // إضافة عنوان الملف
    data.push(["قائمة العملاء"]);
    data.push([]); // سطر فارغ

    // إضافة عناوين الأعمدة
    data.push(["مكان الركوب", "رقم الهوية", "الجنسية", "رقم الجوال", "الاسم"]);

    // إضافة بيانات العملاء
    clients.forEach((client) => {
      data.push([
        client.boardingLocation || "",
        client.identityNumber || "",
        client.nationality || "",
        client.phone || "",
        client.name || "",
      ]);
    });

    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(data);

    // تنسيق الأعمدة مع عرض أكبر
    const wscols = [
      { wch: 25 }, // مكان الركوب
      { wch: 20 }, // رقم الهوية
      { wch: 20 }, // الجنسية
      { wch: 20 }, // رقم الجوال
      { wch: 35 }, // الاسم
    ];
    ws["!cols"] = wscols;

    // تنسيق عنوان الملف
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
    };

    // تنسيق العناوين
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C }); // العنوان في الصف الثالث
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
      ws[cellAddress].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, // خط أبيض
        alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
        fill: { fgColor: { rgb: "4F81BD" } }, // لون خلفية أزرق
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }

    // تنسيق باقي الخلايا
    for (let R = 3; R <= headerRange.e.r; ++R) {
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = {
          alignment: { horizontal: "right", readingOrder: 2, wrapText: true },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }

    // إنشاء مصنف وإضافة الورقة
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العملاء");

    // تصدير الملف
    XLSX.writeFile(wb, "قائمة_العملاء.xlsx");
  };

  const handleDeleteClient = async (clientId) => {
    try {
      // Retrieve the token from local storage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("يجب تسجيل الدخول أولاً");
        setLoading(false);
        return;
      }
      const decodedToken = jwtDecode(token);

      const response = await instance.delete(`/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("تم حذف العميل بنجاح");
      fetchClients(); // Refresh the list
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(
          "غير مصرح لك بحذف العملاء. يجب أن تكون مسؤولاً للقيام بهذه العملية."
        );
      } else if (error.response?.status === 404) {
        toast.error("العميل غير موجود");
      } else {
        toast.error("حدث خطأ أثناء حذف العميل");
      }
      console.error(
        "Error deleting client:",
        error.response?.data || error.message
      );
    }
  };

  // Add delete confirmation dialog
  const confirmDelete = (clientId, clientName) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟`)) {
      handleDeleteClient(clientId);
    }
  };

  // Modify the delete button to use confirmation
  const renderDeleteButton = (clientId, clientName) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        confirmDelete(clientId, clientName);
      }}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
      title="حذف العميل"
    >
      <span className="hidden sm:inline">حذف</span>
      <span className="sm:hidden">🗑️</span>
    </button>
  );

  return (
    <>
      {/* Buttons Container */}
      <div className="my-4 flex flex-col lg:flex-row lg:justify-center gap-4 px-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          إضافة عميل جديد
        </button>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          إرسال رسالة واتساب
        </button>
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer text-center"
        >
          Upload Excel/CSV
        </label>
        <button
          onClick={handleFileUpload}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Upload
        </button>
        <button
          onClick={exportClientsToExcel}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          طباعة ملف العملاء
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">قائمة العملاء</h1>
        <div className="mb-4">
          <input
            type="search"
            placeholder=" ابحث بالاسم، رقم الهوية، أو رقم الجوال أو الجنسية أو مكان الركوب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">تحديد</th>
                <th className="border px-4 py-2">الاسم</th>
                <th className="border px-4 py-2">رقم الجوال</th>
                <th className="border px-4 py-2">الجنسية</th>
                <th className="border px-4 py-2">رقم الهوية</th>
                <th className="border px-4 py-2">مكان الركوب</th>
                <th className="border px-4 py-2">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 text-center">
                    <Checkbox
                      onChange={() => handleSelectClient(client.phone)}
                    />
                  </td>
                  <td className="border px-4 py-2">{client.name}</td>
                  <td className="border px-4 py-2">{client.phone}</td>
                  <td className="border px-4 py-2">{client.nationality}</td>
                  <td className="border px-4 py-2">{client.identityNumber}</td>
                  <td className="border px-4 py-2">
                    {client.boardingLocation}
                  </td>
                  <td className="border px-4 py-2">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => handleEditClick(client, e)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                      >
                        تعديل
                      </button>
                      {renderDeleteButton(client._id, client.name)}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    لا توجد بيانات مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20">
          <h2 className="text-xl font-bold mb-4">Send WhatsApp Message</h2>
          <textarea
            className="w-full p-2 border rounded-lg"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-4 flex justify-end ">
            <div className="mx-2">
              <Button
                variant="outlined"
                className=""
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="mx-2">
              <Button
                variant="contained"
                className=""
                color="success"
                onClick={handleSendWhatsApp}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف هذا العميل؟"
      />

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client._id}
            onClick={() => handleCardClick(client._id)}
            className="relative block overflow-hidden rounded-lg border bg-white mt-6 border-gray-100 p-4 sm:p-6 lg:p-8 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></span>

            <div className="sm:flex sm:justify-between sm:gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {client.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-600">
                  {client.nationality}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-pretty text-gray-500">
                <strong>رقم الجوال:</strong> {client.phone}
              </p>
              <p className="text-sm text-pretty text-gray-500">
                <strong>رقم الهوية:</strong> {client.identityNumber}
              </p>
              <p className="text-sm text-pretty text-gray-500">
                <strong>مكان الركوب:</strong> {client.boardingLocation}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(client, e);
                }}
                className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
              >
                تعديل
              </button>
              {renderDeleteButton(client._id, client.name)}
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-4">
            لا توجد بيانات مطابقة.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed top-1/2 left-1/2 z-50 transform lg:-translate-x-3/4 -translate-x-1/2 lg:w-1/4 w-1/2 -translate-y-1/2">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <AddClientForm onSuccess={closeModal} />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={closeModal}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditForm && currentClient && (
        <div className="fixed top-1/2 left-1/2 z-50 transform lg:-translate-x-3/4 -translate-x-1/2 lg:w-1/4 w-1/2 -translate-y-1/2">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <EditClientForm client={currentClient} onSuccess={closeEditModal} />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={closeEditModal}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Clients;
