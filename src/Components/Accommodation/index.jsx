import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import instance from "../../API/instance";
import toast from "react-hot-toast";
import * as XLSX from "xlsx-js-style";

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
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      try {
        const response = await instance.get(`/trips/${selectedTripId}`);

        const formattedClients = response.data.clients.flatMap((clientObj) => {
          // Extract main client
          const mainClient = {
            id: clientObj.client._id,
            name: clientObj.client.name,
            identity: clientObj.client.identityNumber,
          };

          // Extract accompanying persons
          const accompanyingClients = clientObj.accompanyingPersons.map(
            (person) => ({
              id: person._id,
              name: person.name,
              identity: person.identityNumber,
            })
          );

          return [mainClient, ...accompanyingClients]; // Merge main client and their accompanying persons
        });

        setClients(formattedClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [selectedTripId]);

  // Initialize groups
  const initializeGroups = () => {
    const initialGroups = Array.from({ length: 6 }, (_, i) => ({
      id: uuidv4(),
      name: `مجموعة ${i + 1}`,
      rooms: [],
    }));
    setGroups(initialGroups);
  };

  // Add a new group
  const addGroup = () => {
    setGroups([
      ...groups,
      { id: uuidv4(), name: `مجموعة ${groups.length + 1}`, rooms: [] },
    ]);
  };

  // Delete a group
  const deleteGroup = (groupId) => {
    setGroups(groups.filter((group) => group.id !== groupId));
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
    } else {
      // Dragged between groups
      const sourceGroup = updatedGroups.find(
        (g) => g.id === source.droppableId
      );
      const destinationGroup = updatedGroups.find(
        (g) => g.id === destination.droppableId
      );
      const movedClient = sourceGroup.rooms[source.index];

      sourceGroup.rooms.splice(source.index, 1);
      destinationGroup.rooms.splice(destination.index, 0, movedClient);
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

  useEffect(() => {
    if (!selectedTripId) {
      setRoomCounts({ total: 0, six: 0, five: 0, four: 0, three: 0, two: 0 });
      return;
    }

    const fetchAccommodation = async () => {
      try {
        const response = await instance.get(
          `/accommodations/${selectedTripId}`
        );
        if (response.data) {
          setSupervisorName(response.data.supervisorName);
          setSupervisorPhone(response.data.supervisorPhone);
          setGroups(response.data.groups);
          setRoomCounts(response.data.roomCounts);
        } else {
          initializeGroups(); // إعادة ضبط المجموعات عند عدم وجود بيانات
          setRoomCounts({
            total: 0,
            six: 0,
            five: 0,
            four: 0,
            three: 0,
            two: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching accommodation:", error);
      }
    };

    fetchAccommodation();
  }, [selectedTripId]);

  const exportToExcel = () => {
    const data = [];

    // إضافة بيانات مسؤول الرحلة في الأعلى
    data.push(["اسم المشرف:", supervisorName]);
    data.push(["رقم جوال المشرف:", supervisorPhone]);
    data.push([]); // سطر فارغ للفصل

    // تنظيم المجموعات في صفوف
    let currentRow = 3;
    for (let i = 0; i < groups.length; i += 3) {
      // إضافة عناوين المجموعات
      const headerRow = [];
      if (groups[i]) headerRow[0] = `المجموعة: ${groups[i].name}`;
      if (groups[i + 1]) headerRow[3] = `المجموعة: ${groups[i + 1].name}`;
      if (groups[i + 2]) headerRow[6] = `المجموعة: ${groups[i + 2].name}`;
      data.push(headerRow);

      // تحديد أقصى عدد من الغرف في المجموعات الثلاث الحالية
      const maxRooms = Math.max(
        groups[i]?.rooms.length || 0,
        groups[i + 1]?.rooms.length || 0,
        groups[i + 2]?.rooms.length || 0
      );

      // إضافة بيانات الغرف
      for (let j = 0; j < maxRooms; j++) {
        const roomRow = [];

        // المجموعة الأولى
        if (groups[i] && groups[i].rooms[j]) {
          roomRow[0] = groups[i].rooms[j].name;
          roomRow[1] = groups[i].rooms[j].identity;
        }

        // المجموعة الثانية
        if (groups[i + 1] && groups[i + 1].rooms[j]) {
          roomRow[3] = groups[i + 1].rooms[j].name;
          roomRow[4] = groups[i + 1].rooms[j].identity;
        }

        // المجموعة الثالثة
        if (groups[i + 2] && groups[i + 2].rooms[j]) {
          roomRow[6] = groups[i + 2].rooms[j].name;
          roomRow[7] = groups[i + 2].rooms[j].identity;
        }

        data.push(roomRow);
      }

      // إضافة سطر فارغ بين مجموعات الصفوف
      data.push([]);
    }

    // إضافة مسافة قبل إحصائيات الغرف
    data.push([]);
    data.push([]);

    // إضافة إحصائيات الغرف
    data.push(["إحصائيات الغرف"]);
    data.push([
      "إجمالي عدد الغرف",
      "الغرف السداسية",
      "الخماسية",
      "الرباعية",
      "الثلاثية",
      "الثنائية",
    ]);
    data.push([
      roomCounts.total,
      roomCounts.six,
      roomCounts.five,
      roomCounts.four,
      roomCounts.three,
      roomCounts.two,
    ]);

    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(data);

    // تنسيق الخلايا
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = {
          alignment: {
            horizontal: "right",
            vertical: "center",
          },
          font: {
            sz: 12,
            bold: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    // تنسيق عناوين المجموعات
    groups.forEach((_, index) => {
      const row =
        Math.floor(index / 3) *
          (Math.max(
            ...groups
              .slice(index - (index % 3), index - (index % 3) + 3)
              .map((g) => g.rooms.length)
          ) +
            2) +
        3;
      const col = (index % 3) * 3;
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          ...ws[cellAddress].s,
          font: {
            sz: 14,
            bold: true,
            color: { rgb: "0000FF" },
          },
          fill: {
            fgColor: { rgb: "EEEEEE" },
          },
        };
      }
    });

    // تنسيق بيانات المشرف
    for (let R = 0; R < 2; ++R) {
      for (let C = 0; C < 2; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        ws[cellAddress].s = {
          ...ws[cellAddress].s,
          font: {
            sz: 14,
            bold: true,
          },
          border: {
            top: {
              style: R === 0 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            bottom: {
              style: R === 1 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            left: {
              style: C === 0 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            right: {
              style: C === 1 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
          },
        };
      }
    }

    // تنسيق إحصائيات الغرف
    const statsStart = data.length - 3;
    for (let R = statsStart; R < data.length; ++R) {
      for (let C = 0; C < 6; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        ws[cellAddress].s = {
          ...ws[cellAddress].s,
          font: {
            sz: 12,
            bold: true,
          },
          border: {
            top: {
              style: R === statsStart ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            bottom: {
              style: R === data.length - 1 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            left: {
              style: C === 0 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
            right: {
              style: C === 5 ? "thick" : "thin",
              color: { rgb: "000000" },
            },
          },
          fill: {
            fgColor: { rgb: R === statsStart ? "DDDDDD" : "FFFFFF" },
          },
        };
      }
    }

    // تنسيق عرض الأعمدة
    const wscols = [
      { wch: 20 }, // الاسم
      { wch: 15 }, // رقم الهوية
      { wch: 5 }, // فاصل
      { wch: 20 }, // الاسم
      { wch: 15 }, // رقم الهوية
      { wch: 5 }, // فاصل
      { wch: 20 }, // الاسم
      { wch: 15 }, // رقم الهوية
    ];
    ws["!cols"] = wscols;

    // إنشاء المصنف وإضافة الورقة
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تسكين الرحلات");

    // تحديد اسم الملف
    const selectedTrip = trips.find((trip) => trip.value === selectedTripId);
    const fileName = selectedTrip
      ? `تسكين_الرحلة_${selectedTrip.label.replace(/ - /g, "_")}.xlsx`
      : "تسكين_الرحلات.xlsx";

    // تصدير الملف
    XLSX.writeFile(wb, fileName);
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
                {Object.keys(roomCounts).map((key) => (
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
