import React, { useEffect, useState } from "react";
import AddClientForm from "./AddClient";
import instance from "../../API/instance";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Modal, Button, Checkbox } from "@mui/material";

const Clients = () => {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [message, setMessage] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const response = await instance.get("/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch clients on component mount
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

  // Close the modal and refresh clients
  const closeModal = () => {
    setShowForm(false);
    fetchClients(); // Refresh clients after closing the modal
  };

  // Handle card click to navigate to client page
  const handleCardClick = (clientId) => {
    navigate(`/client/${clientId}`); // Navigate to the client page
  };

  const handleSelectClient = (phone) => {
    setSelectedClients((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
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
  return (
    <>
      <div className="my-4 flex justify-center gap-4">
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
          className="bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          Upload Excel/CSV
        </label>
        <button
          onClick={handleFileUpload}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Upload
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
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    لا توجد بيانات مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20">
          <h2 className="text-xl font-bold mb-4">Send WhatsApp Message</h2>
          <textarea
            className="w-full p-2 border rounded-lg"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outlined" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSendWhatsApp}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client._id}
            onClick={() => handleCardClick(client._id)} // Navigate on click
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

              <div className="hidden sm:block sm:shrink-0">
                <img
                  alt=""
                  src="https://via.placeholder.com/150"
                  className="size-16 rounded-lg object-cover shadow-xs"
                />
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

            <dl className="mt-6 flex gap-4 sm:gap-6">
              <div className="flex flex-col-reverse">
                <dt className="text-sm font-medium text-gray-600">Client ID</dt>
                <dd className="text-xs text-gray-500">{client._id}</dd>
              </div>
            </dl>
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

            {/* Centered buttons */}
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
    </>
  );
};

export default Clients;
