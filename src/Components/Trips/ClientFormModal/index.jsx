import React from "react";

const ClientFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  clientData,
  setClientData,
  title,
  submitText,
}) => {
  if (!isOpen) return null;

  // Calculate total cost when clientCount or pricePerPerson changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setClientData((prev) => {
      const updatedClient = {
        ...prev,
        [name]:
          name === "clientCount" || name === "pricePerPerson"
            ? parseFloat(value) || 0
            : value,
      };

      // Recalculate total cost
      if (name === "clientCount" || name === "pricePerPerson") {
        updatedClient.totalCost =
          updatedClient.clientCount * updatedClient.pricePerPerson;

        // Update accompanying persons array length
        if (name === "clientCount") {
          const currentLength = updatedClient.accompanyingPersons.length;
          const newLength = Math.max(0, updatedClient.clientCount - 1);

          if (newLength > currentLength) {
            // Add new empty persons
            updatedClient.accompanyingPersons = [
              ...updatedClient.accompanyingPersons,
              ...Array.from({ length: newLength - currentLength }, () => ({
                name: "",
                nationality: "",
                identityNumber: "",
              })),
            ];
          } else if (newLength < currentLength) {
            // Remove extra persons
            updatedClient.accompanyingPersons =
              updatedClient.accompanyingPersons.slice(0, newLength);
          }
        }
      }

      return updatedClient;
    });
  };

  const handleAccompanyingPersonChange = (index, field, value) => {
    setClientData((prev) => {
      const updatedPersons = [...prev.accompanyingPersons];
      updatedPersons[index][field] = value;
      return { ...prev, accompanyingPersons: updatedPersons };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare the data to be sent
    const submitData = {
      clientId: clientData._id || "",
      name: clientData.name,
      phone: clientData.phone,
      identityNumber: clientData.identityNumber,
      nationality: clientData.nationality,
      boardingLocation: clientData.boardingLocation,
      accompanyingPersons: clientData.accompanyingPersons,
      returnStatus: clientData.returnStatus || "لا",
      returnDate:
        clientData.returnStatus === "نعم" ? clientData.returnDate : undefined,
      totalCost: clientData.totalCost,
      totalPaid: clientData.totalPaid || 0, // Default to 0 if not provided
      pricePerPerson: clientData.pricePerPerson,
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic client fields */}
            <div>
              <label className="block mb-1">الاسم</label>
              <input
                type="text"
                name="name"
                value={clientData.name}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">عدد الأفراد</label>
              <input
                type="number"
                name="clientCount"
                value={clientData.clientCount}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block mb-1">سعر الفرد الواحد</label>
              <input
                type="number"
                name="pricePerPerson"
                value={clientData.pricePerPerson}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block mb-1">التكلفة الإجمالية</label>
              <input
                type="number"
                value={clientData.totalCost}
                className="p-2 border rounded-lg w-full bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="block mb-1">رقم الجوال</label>
              <input
                type="text"
                name="phone"
                value={clientData.phone}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">رقم الهوية</label>
              <input
                type="text"
                name="identityNumber"
                value={clientData.identityNumber}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">الجنسية</label>
              <input
                type="text"
                name="nationality"
                value={clientData.nationality}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">مكان الركوب</label>
              <input
                type="text"
                name="boardingLocation"
                value={clientData.boardingLocation}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">حالة العودة</label>
              <select
                name="returnStatus"
                value={clientData.returnStatus}
                onChange={handleInputChange}
                className="p-2 border rounded-lg w-full"
              >
                <option value="لا">لا</option>
                <option value="نعم">نعم</option>
              </select>
            </div>
            {clientData.returnStatus === "نعم" && (
              <div>
                <label className="block mb-1">تاريخ العودة</label>
                <input
                  type="date"
                  name="returnDate"
                  value={clientData.returnDate || ""}
                  onChange={handleInputChange}
                  className="p-2 border rounded-lg w-full"
                  required={clientData.returnStatus === "نعم"}
                />
              </div>
            )}
          </div>

          {/* Accompanying persons fields */}
          {clientData.accompanyingPersons.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">الأفراد المرافقون</h3>
              <div className="space-y-4">
                {clientData.accompanyingPersons.map((person, index) => (
                  <div key={index} className="border p-4 rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">فرد مرافق {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-1">الاسم</label>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) =>
                            handleAccompanyingPersonChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className="p-2 border rounded-lg w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">الجنسية</label>
                        <input
                          type="text"
                          value={person.nationality}
                          onChange={(e) =>
                            handleAccompanyingPersonChange(
                              index,
                              "nationality",
                              e.target.value
                            )
                          }
                          className="p-2 border rounded-lg w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">رقم الهوية</label>
                        <input
                          type="text"
                          value={person.identityNumber}
                          onChange={(e) =>
                            handleAccompanyingPersonChange(
                              index,
                              "identityNumber",
                              e.target.value
                            )
                          }
                          className="p-2 border rounded-lg w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientFormModal;
