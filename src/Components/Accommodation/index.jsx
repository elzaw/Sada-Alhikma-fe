import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import instance from "../../API/instance";
import toast from "react-hot-toast";
import * as XLSX from "xlsx-js-style";
import { jwtDecode } from "jwt-decode";

const Accommodation = () => {
  // State management
  const [tripDates, setTripDates] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomCounts, setRoomCounts] = useState({
    total: 0,
    six: 0,
    five: 0,
    four: 0,
    three: 0,
    two: 0,
  });

  // دالة تحديث أعداد الغرف
  const updateRoomCount = (key, value) => {
    setRoomCounts((prevCounts) => ({
      ...prevCounts,
      [key]: value,
    }));
  };

  // Fetch all trips on component mount
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await instance.get("/trips");
        const formattedTrips = response.data.map((trip) => ({
          value: trip._id,
          label: `${trip.tripNumber} - ${new Date(
            trip.date
          ).toLocaleDateString()}`,
        }));
        setTrips(formattedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };
    fetchTrips();
  }, []);

  // Fetch clients when a trip is selected
  useEffect(() => {
    if (!selectedTripId) {
      setClients([]);
      setGroups([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // First fetch accommodation data
        let existingGroups = [];
        let existingAssignedClientIds = new Set();

        try {
          const accommodationResponse = await instance.get(
            `/accommodations/${selectedTripId}`
          );
          if (accommodationResponse.data) {
            existingGroups = accommodationResponse.data.groups || [];
            setSupervisorName(accommodationResponse.data.supervisorName || "");
            setSupervisorPhone(
              accommodationResponse.data.supervisorPhone || ""
            );
            setRoomCounts(
              accommodationResponse.data.roomCounts || {
                total: 0,
                six: 0,
                five: 0,
                four: 0,
                three: 0,
                two: 0,
              }
            );

            // Collect all assigned client IDs
            existingGroups.forEach((group) => {
              if (group.rooms) {
                group.rooms.forEach((room) => {
                  if (room.id) {
                    existingAssignedClientIds.add(room.id);
                  }
                });
              }
            });
          }
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error("Error fetching accommodation:", error);
          }
          // If 404 or other error, we'll just use empty groups
          existingGroups = [];
        }

        // Then fetch all clients
        const tripResponse = await instance.get(`/trips/${selectedTripId}`);
        const allClients = tripResponse.data.clients.flatMap((clientObj) => {
          const mainClient = {
            id: clientObj.client._id,
            name: clientObj.client.name,
            identity: clientObj.client.identityNumber,
          };

          const accompanyingClients = clientObj.accompanyingPersons.map(
            (person) => ({
              id: person._id,
              name: person.name,
              identity: person.identityNumber,
            })
          );

          return [mainClient, ...accompanyingClients];
        });

        // Filter out assigned clients
        const availableClients = allClients.filter(
          (client) => !existingAssignedClientIds.has(client.id)
        );

        // Update state
        setGroups(
          existingGroups.length > 0 ? existingGroups : initializeGroups()
        );
        setClients(availableClients);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTripId]);

  // Initialize groups
  const initializeGroups = () => {
    const initialGroups = Array.from({ length: 6 }, (_, i) => ({
      id: uuidv4(),
      name: `مجموعة ${i + 1}`,
      rooms: [],
    }));
    return initialGroups;
  };

  // Update available clients whenever groups change
  useEffect(() => {
    if (!selectedTripId || !groups) return;

    const assignedClientIds = new Set();
    groups.forEach((group) => {
      if (group.rooms) {
        group.rooms.forEach((room) => {
          if (room.id) {
            assignedClientIds.add(room.id);
          }
        });
      }
    });

    // Re-filter the clients list based on current assignments
    setClients((prevClients) =>
      prevClients.filter((client) => !assignedClientIds.has(client.id))
    );
  }, [groups]);

  // Add a new group
  const addGroup = () => {
    setGroups([
      ...groups,
      { id: uuidv4(), name: `مجموعة ${groups.length + 1}`, rooms: [] },
    ]);
  };

  // Delete a group
  const deleteGroup = async (groupId) => {
    try {
      const groupToDelete = groups.find((g) => g.id === groupId);
      if (!groupToDelete) {
        toast.error("لم يتم العثور على المجموعة");
        return;
      }

      console.log("Deleting group:", groupToDelete.name); // Debug log

      const response = await instance.delete(
        `/accommodations/${selectedTripId}/groups/${encodeURIComponent(
          groupToDelete.name
        )}`
      );

      // Update local state with the updated accommodation data from the response
      if (response.data && response.data.accommodation) {
        // Renumber the groups
        const updatedGroups = response.data.accommodation.groups.map(
          (group, index) => ({
            ...group,
            name: `مجموعة ${index + 1}`,
          })
        );
        setGroups(updatedGroups);
        toast.success("تم حذف المجموعة بنجاح");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      if (error.response?.status === 404) {
        toast.error("لم يتم العثور على المجموعة المطلوبة");
      } else {
        toast.error("حدث خطأ أثناء حذف المجموعة");
      }
    }
  };

  // Drag-and-Drop Handler
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    let updatedGroups = [...groups];
    let updatedClients = [...clients];

    // If dragged from client list
    if (source.droppableId === "clients") {
      const client = clients[source.index];
      updatedClients.splice(source.index, 1);
      updatedGroups = updatedGroups.map((group) =>
        group.id === destination.droppableId
          ? { ...group, rooms: [...group.rooms, client] }
          : group
      );
    } else if (destination.droppableId === "clients") {
      // If dragged back to client list
      const sourceGroup = updatedGroups.find(
        (g) => g.id === source.droppableId
      );
      if (sourceGroup) {
        const client = sourceGroup.rooms[source.index];
        updatedClients.push(client);
        updatedGroups = updatedGroups.map((group) =>
          group.id === source.droppableId
            ? {
                ...group,
                rooms: group.rooms.filter((_, i) => i !== source.index),
              }
            : group
        );
      }
    } else {
      // Dragged between groups
      const sourceGroup = updatedGroups.find(
        (g) => g.id === source.droppableId
      );
      const destinationGroup = updatedGroups.find(
        (g) => g.id === destination.droppableId
      );
      if (sourceGroup && destinationGroup) {
        const movedClient = sourceGroup.rooms[source.index];
        sourceGroup.rooms.splice(source.index, 1);
        destinationGroup.rooms.splice(destination.index, 0, movedClient);
      }
    }

    setGroups(updatedGroups);
    setClients(updatedClients);
  };

  const saveAccommodation = async () => {
    if (!selectedTripId) {
      alert("يرجى اختيار رحلة قبل الحفظ.");
      return;
    }

    const accommodationData = {
      tripId: selectedTripId,
      supervisorName,
      supervisorPhone,
      groups,
      roomCounts,
    };

    try {
      const response = await instance.post(
        "/accommodations",
        accommodationData
      );
      toast.success("تم حفظ التسكين بنجاح!");
      console.log("Accommodation saved:", response.data);
    } catch (error) {
      console.error("Error saving accommodation:", error);
      toast.error("حدث خطأ أثناء الحفظ. الرجاء المحاولة مرة أخرى.");
    }
  };

  const exportToExcel = () => {
    const data = [];

    // إضافة عنوان الملف
    data.push(["تسكين العملاء"]);
    data.push([]); // سطر فارغ

    // إضافة بيانات مسؤول الرحلة في الأعلى (معكوسة للعربية)
    data.push(["محمود", "اسم المشرف:"]);
    data.push([supervisorPhone || "", "رقم جوال المشرف:"]);
    data.push([]); // سطر فارغ للفصل

    // تنظيم المجموعات في صفوف (من اليمين لليسار)
    let currentRow = 5;

    // حساب عدد الصفوف لكل مجموعة من 3 مجموعات
    const groupSets = [];
    for (let i = 0; i < groups.length; i += 3) {
      const maxRoomsInSet = Math.max(
        groups[i]?.rooms.length || 0,
        groups[i + 1]?.rooms.length || 0,
        groups[i + 2]?.rooms.length || 0
      );
      groupSets.push({
        startIndex: i,
        maxRooms: maxRoomsInSet,
      });
    }

    // إضافة البيانات لكل مجموعة من 3 مجموعات
    groupSets.forEach(({ startIndex, maxRooms }, setIndex) => {
      const i = startIndex;

      // إضافة عناوين المجموعات (معكوسة للعربية)
      const headerRow = Array(9).fill("");
      if (groups[i + 2]) headerRow[0] = `المجموعة: ${groups[i + 2].name}`;
      if (groups[i + 1]) headerRow[3] = `المجموعة: ${groups[i + 1].name}`;
      if (groups[i]) headerRow[6] = `المجموعة: ${groups[i].name}`;
      data.push(headerRow);

      // إضافة عناوين الهوية والاسم (معكوسة)
      const subHeaderRow = Array(9).fill("");
      subHeaderRow[1] = "رقم الهوية";
      subHeaderRow[0] = "الاسم";
      subHeaderRow[4] = "رقم الهوية";
      subHeaderRow[3] = "الاسم";
      subHeaderRow[7] = "رقم الهوية";
      subHeaderRow[6] = "الاسم";
      data.push(subHeaderRow);

      // إضافة بيانات الغرف (معكوسة للعربية)
      for (let j = 0; j < maxRooms; j++) {
        const roomRow = Array(9).fill("");

        // المجموعة الثالثة (تصبح الأولى من اليمين)
        if (groups[i + 2] && groups[i + 2].rooms[j]) {
          roomRow[0] = groups[i + 2].rooms[j].name || "";
          roomRow[1] = groups[i + 2].rooms[j].identity || "";
        }

        // المجموعة الثانية (تبقى في الوسط)
        if (groups[i + 1] && groups[i + 1].rooms[j]) {
          roomRow[3] = groups[i + 1].rooms[j].name || "";
          roomRow[4] = groups[i + 1].rooms[j].identity || "";
        }

        // المجموعة الأولى (تصبح الأخيرة من اليسار)
        if (groups[i] && groups[i].rooms[j]) {
          roomRow[6] = groups[i].rooms[j].name || "";
          roomRow[7] = groups[i].rooms[j].identity || "";
        }

        data.push(roomRow);
      }

      // إضافة سطر فارغ بين مجموعات الصفوف
      data.push(Array(9).fill(""));
    });

    // إضافة مسافة قبل إحصائيات الغرف
    data.push([]);
    data.push([]);

    // إضافة إحصائيات الغرف (معكوسة للعربية)
    data.push(["إحصائيات الغرف"]);
    data.push([
      "الثنائية",
      "الثلاثية",
      "الرباعية",
      "الخماسية",
      "الغرف السداسية",
      "إجمالي عدد الغرف",
    ]);
    data.push([
      roomCounts.two || 0,
      roomCounts.three || 0,
      roomCounts.four || 0,
      roomCounts.five || 0,
      roomCounts.six || 0,
      roomCounts.total || 0,
    ]);

    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(data);

    // تنسيق الأعمدة مع عرض مناسب
    const wscols = [
      { wch: 25 }, // المجموعة 1 - الاسم
      { wch: 15 }, // المجموعة 1 - الهوية
      { wch: 5 }, // فاصل
      { wch: 25 }, // المجموعة 2 - الاسم
      { wch: 15 }, // المجموعة 2 - الهوية
      { wch: 5 }, // فاصل
      { wch: 25 }, // المجموعة 3 - الاسم
      { wch: 15 }, // المجموعة 3 - الهوية
      { wch: 5 }, // فاصل
    ];
    ws["!cols"] = wscols;

    // تنسيق ارتفاع الصفوف
    const wsrows = [];
    for (let i = 0; i < data.length; i++) {
      // ارتفاع أقل للصفوف العادية
      wsrows[i] = { hpt: 15 }; // حوالي 20 بكسل

      // ارتفاع أكبر قليلاً للعناوين
      if (
        i === 0 || // عنوان الملف
        i === 2 ||
        i === 3 || // بيانات المشرف
        data[i].some(
          (cell) => typeof cell === "string" && cell.includes("المجموعة")
        ) || // عناوين المجموعات
        data[i].some(
          (cell) => typeof cell === "string" && cell.includes("إحصائيات الغرف")
        ) // عنوان الإحصائيات
      ) {
        wsrows[i] = { hpt: 25 }; // حوالي 33 بكسل
      }
    }
    ws["!rows"] = wsrows;

    // تنسيق عنوان الملف
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    ws[titleCell].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        readingOrder: 2,
        rtl: true,
        wrapText: true,
      },
      fill: { fgColor: { rgb: "4F81BD" } },
    };

    // دمج خلايا عناوين المجموعات
    let merges = [];
    let currentRowIndex = 5;

    groupSets.forEach(({ maxRooms }, setIndex) => {
      const rowIndex = currentRowIndex;
      // المجموعة الثالثة (يمين)
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
      // المجموعة الثانية (وسط)
      merges.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 4 } });
      // المجموعة الأولى (يسار)
      merges.push({ s: { r: rowIndex, c: 6 }, e: { r: rowIndex, c: 7 } });

      currentRowIndex += maxRooms + 3; // +3 for header, subheader, and empty row
    });

    ws["!merges"] = merges;

    // تنسيق الخلايا
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };

        // التنسيق الأساسي لجميع الخلايا
        ws[cellAddress].s = {
          alignment: {
            horizontal: "right",
            vertical: "center",
            readingOrder: 2,
            rtl: true,
            wrapText: true,
          },
          font: {
            sz: 12,
            name: "Arial",
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };

        // تنسيق خاص لعناوين المجموعات
        let isGroupHeader = false;
        let isSubHeader = false;

        // حساب موقع الصف في مجموعة معينة
        let accumulatedRows = 5;
        for (
          let groupSetIndex = 0;
          groupSetIndex < groupSets.length;
          groupSetIndex++
        ) {
          const { maxRooms } = groupSets[groupSetIndex];

          if (R === accumulatedRows) {
            isGroupHeader = true;
            break;
          }

          if (R === accumulatedRows + 1) {
            isSubHeader = true;
            break;
          }

          accumulatedRows += maxRooms + 3;
        }

        // تطبيق التنسيق المناسب
        if (isGroupHeader) {
          ws[cellAddress].s = {
            ...ws[cellAddress].s,
            font: {
              sz: 14,
              bold: true,
              color: { rgb: "FFFFFF" },
            },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: {
              horizontal: "center",
              vertical: "center",
              readingOrder: 2,
              rtl: true,
              wrapText: true,
            },
          };
        } else if (isSubHeader) {
          ws[cellAddress].s = {
            ...ws[cellAddress].s,
            font: { sz: 12, bold: true },
            fill: { fgColor: { rgb: "E6E6E6" } },
            alignment: {
              horizontal: "center",
              vertical: "center",
              readingOrder: 2,
              rtl: true,
              wrapText: true,
            },
          };
        }
      }
    }

    // تنسيق بيانات المشرف
    for (let R = 2; R < 4; ++R) {
      for (let C = 0; C < 2; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: {
              horizontal: C === 1 ? "left" : "right", // عنوان يسار، قيمة يمين
              vertical: "center",
              readingOrder: 2,
              rtl: true,
              wrapText: true,
            },
            font: {
              sz: 14,
              bold: C === 1, // العنوان عريض
              color: { rgb: C === 1 ? "000000" : "000000" },
            },
            fill: { fgColor: { rgb: "E6E6E6" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };
        }
      }
    }

    // تنسيق إحصائيات الغرف
    const statsStartRow = data.length - 3;
    for (let R = statsStartRow; R < data.length; ++R) {
      for (let C = 0; C < 6; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: {
              horizontal: "center",
              vertical: "center",
              readingOrder: 2,
              rtl: true,
              wrapText: true,
            },
            font: {
              sz: 12,
              bold: true,
              color: { rgb: R === statsStartRow ? "FFFFFF" : "000000" },
            },
            fill: {
              fgColor: { rgb: R === statsStartRow ? "4F81BD" : "E6E6E6" },
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };
        }
      }
    }

    // إنشاء مصنف وإضافة الورقة
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التسكين");

    // تصدير الملف
    XLSX.writeFile(wb, `تسكين_العملاء.xlsx`);
  };

  const handleDelete = async (id) => {
    try {
      // Retrieve the token from local storage
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const decodedToken = jwtDecode(token);

      const response = await instance.delete(`/accommodation/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("تم الحذف بنجاح");
      fetchAccommodations(); // Refresh the list
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("غير مصرح لك بهذه العملية. يجب أن تكون مسؤولاً.");
      } else if (error.response?.status === 404) {
        toast.error("العنصر غير موجود");
      } else {
        toast.error("حدث خطأ أثناء عملية الحذف");
      }
      console.error("Delete error:", error.response?.data || error.message);
    }
  };

  const deleteClientFromRoom = async (groupId, roomIndex) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group) {
        toast.error("لم يتم العثور على المجموعة");
        return;
      }

      const response = await instance.delete(
        `/accommodations/${selectedTripId}/groups/${group.name}/rooms/${roomIndex}`
      );

      // Update local state
      const updatedGroups = groups.map((g) => {
        if (g.id === groupId) {
          const updatedRooms = [...g.rooms];
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            clientId: null,
            name: null,
            identity: null,
          };
          return { ...g, rooms: updatedRooms };
        }
        return g;
      });

      setGroups(updatedGroups);
      toast.success("تم حذف العميل من الغرفة بنجاح");
    } catch (error) {
      console.error("Error deleting client from room:", error);
      toast.error("حدث خطأ أثناء حذف العميل من الغرفة");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">تسكين الرحلات</h1>
      {/* Trip Selection */}
      <div className="mb-4">
        <label className="block mb-1">الرحلة</label>
        <Select
          options={trips}
          placeholder="اختر رحلة"
          isClearable
          isLoading={loading}
          onChange={(selected) => {
            setSelectedTripId(selected?.value || null);
            initializeGroups();
          }}
        />
      </div>
      {/* Supervisor Details */}
      <div className="mb-4">
        <label className="block">اسم المشرف:</label>
        <input
          type="text"
          value={supervisorName}
          onChange={(e) => setSupervisorName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <label className="block">رقم جوال المشرف:</label>
        <input
          type="text"
          value={supervisorPhone}
          onChange={(e) => setSupervisorPhone(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      {/* Drag-and-Drop System */}
      {selectedTripId && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Clients List */}
            <Droppable droppableId="clients">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="border p-4 bg-gray-100 rounded"
                >
                  <h2 className="text-lg font-bold mb-2">العملاء المتاحون</h2>
                  {clients.map((client, index) => (
                    <Draggable
                      key={client.id}
                      draggableId={client.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-2 mb-2 rounded shadow cursor-pointer"
                        >
                          {client.name} - {client.identity}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Groups */}
            {groups.map((group) => (
              <Droppable key={group.id} droppableId={group.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="border p-4 bg-gray-100 rounded"
                  >
                    <div className="flex justify-between mb-2">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) =>
                          setGroups(
                            groups.map((g) =>
                              g.id === group.id
                                ? { ...g, name: e.target.value }
                                : g
                            )
                          )
                        }
                        className="border p-2 w-2/3"
                      />
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        حذف
                      </button>
                    </div>

                    {/* Assigned Clients */}
                    {group.rooms.map((room, index) => (
                      <Draggable
                        key={room.id}
                        draggableId={room.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-2 mb-2 rounded shadow cursor-pointer"
                          >
                            {room.name} - {room.identity}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
      <button
        onClick={addGroup}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
      >
        + إضافة مجموعة
      </button>

      <button
        onClick={saveAccommodation}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 mx-5"
      >
        💾 حفظ التسكين
      </button>

      <button
        onClick={exportToExcel}
        className="bg-purple-500 text-white px-4 py-2 rounded mt-4"
      >
        📊 تصدير إلى Excel
      </button>
      {/* Room statistics */}
      {selectedTripId && (
        <div className="mt-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-2">إحصائيات الغرف</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">إجمالي عدد الغرف</th>
                <th className="border p-2">الغرف السداسية</th>
                <th className="border p-2">الخماسية</th>
                <th className="border p-2">الرباعية</th>
                <th className="border p-2">الثلاثية</th>
                <th className="border p-2">الثنائية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {roomCounts &&
                  Object.keys(roomCounts).map((key) => (
                    <td key={key} className="border p-2">
                      <input
                        type="number"
                        value={roomCounts[key]}
                        onChange={(e) => updateRoomCount(key, e.target.value)}
                        className="border p-1 w-full"
                      />
                    </td>
                  ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Accommodation;
