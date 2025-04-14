const UpdateClientOnTrip = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    const updateData = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(tripId) ||
      !mongoose.Types.ObjectId.isValid(clientId)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid Trip or Client ID format" });
    }

    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Find the client in the trip
    const clientInTrip = trip.clients.find(
      (c) => c.client.toString() === clientId
    );

    if (!clientInTrip) {
      return res.status(404).json({ error: "Client not found in this trip" });
    }

    // Calculate differences for totals
    const oldCost = clientInTrip.totalCost || 0;
    const oldPaid = clientInTrip.totalPaid || 0;

    // Update client data
    if (updateData.accompanyingPersons !== undefined) {
      clientInTrip.accompanyingPersons = updateData.accompanyingPersons;
    }
    if (updateData.returnStatus !== undefined) {
      clientInTrip.returnStatus = updateData.returnStatus;
    }
    if (updateData.returnDate !== undefined) {
      clientInTrip.returnDate =
        updateData.returnStatus === "نعم" ? updateData.returnDate : undefined;
    }
    if (updateData.totalCost !== undefined) {
      clientInTrip.totalCost = updateData.totalCost;
    }
    if (updateData.totalPaid !== undefined) {
      clientInTrip.totalPaid = updateData.totalPaid;
    }
    if (updateData.boardingLocation !== undefined) {
      clientInTrip.boardingLocation = updateData.boardingLocation;
    }
    if (updateData.notes !== undefined) {
      clientInTrip.notes = updateData.notes;
    }

    // Calculate new net amount
    clientInTrip.netAmount =
      (clientInTrip.totalCost || 0) - (clientInTrip.totalPaid || 0);

    // Update trip totals
    trip.totalTripCost =
      (trip.totalTripCost || 0) - oldCost + (clientInTrip.totalCost || 0);
    trip.totalTripPaid =
      (trip.totalTripPaid || 0) - oldPaid + (clientInTrip.totalPaid || 0);
    trip.totalTripNetAmount = trip.totalTripCost - trip.totalTripPaid;

    // Save the updated trip
    await trip.save();

    // Populate the client details before sending response
    const updatedTrip = await Trip.findById(tripId)
      .populate("clients.client")
      .populate("drivers");

    res.json({
      message: "Client data updated successfully",
      updatedTrip: updatedTrip,
    });
  } catch (error) {
    console.error("Error updating client in trip:", error);
    res.status(500).json({ error: error.message });
  }
};
