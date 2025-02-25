import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import instance from "../../API/instance";
import toast from "react-hot-toast";
// import instance from "../../../API/instance";

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
  // إضافة الحالة لتتبع عدد الغرف
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
          <div className="grid grid-cols-3 gap-4">
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

      {/* Room statistics */}
      {/* // تعديل جدول الإحصائيات للتأكد من أنه يظهر عند اختيار رحلة */}
      {selectedTripId && (
        <div className="mt-6">
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
