import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../API/instance";
import toast from "react-hot-toast";
import CreateTripForm from "./CreateTripForm";
import UpdateTripForm from "./UpdateTripForm";
import { ConfirmDialog } from "../ConfirmDialog"; // Import the ConfirmDialog component

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterTripNumber, setFilterTripNumber] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch trips from API
  const fetchTrips = async () => {
    try {
      const response = await instance.get("/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to fetch trips");
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Navigate to trip page
  const handleTripClick = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  // Handle update button click
  const handleUpdateClick = (trip, e) => {
    e.stopPropagation();
    setCurrentTrip(trip);
    setShowUpdateForm(true);
  };

  // Handle delete button click
  const handleDeleteClick = (tripId, e) => {
    e.stopPropagation();
    setTripToDelete(tripId);
    setConfirmOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      await instance.delete(`/trips/${tripToDelete}`);
      toast.success("تم حذف الرحلة بنجاح");
      fetchTrips(); // Refresh the list
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error("فشل في حذف الرحلة");
    } finally {
      setConfirmOpen(false);
      setTripToDelete(null);
    }
  };

  // Filter trips based on date and trip number
  const filteredTrips = trips.filter((trip) => {
    const matchesDate = filterDate
      ? new Date(trip.date).toISOString().split("T")[0] === filterDate
      : true;
    const matchesTripNumber = filterTripNumber
      ? trip.tripNumber.includes(filterTripNumber)
      : true;
    return matchesDate && matchesTripNumber;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">إدارة الرحلات</h1>

      {/* Filters and Create Trip Button */}
      <div className="mb-4 flex flex-col lg:flex-row gap-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="ابحث برقم الرحلة"
          value={filterTripNumber}
          onChange={(e) => setFilterTripNumber(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          إنشاء رحلة جديدة
        </button>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => (
          <div
            key={trip._id}
            onClick={() => handleTripClick(trip._id)}
            className="p-4 border rounded-lg shadow-sm bg-white cursor-pointer hover:bg-gray-50 relative"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">
                  الرحلة: {trip.tripNumber} -{" "}
                  {new Date(trip.date).toLocaleDateString()} -{" "}
                  {new Date(trip.date).toLocaleDateString("ar-SA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleUpdateClick(trip, e)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                >
                  تعديل
                </button>
                <button
                  onClick={(e) => handleDeleteClick(trip._id, e)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Trip Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-6">
                <CreateTripForm
                  setShowCreateForm={setShowCreateForm}
                  onTripCreated={fetchTrips}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Trip Modal */}
      {showUpdateForm && currentTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-6">
                <UpdateTripForm
                  trip={currentTrip}
                  setShowUpdateForm={setShowUpdateForm}
                  onTripUpdated={fetchTrips}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف هذه الرحلة؟"
      />
    </div>
  );
};

export default Trips;
