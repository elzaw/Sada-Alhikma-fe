import React from "react";
import { useLocation } from "react-router-dom"; // لاستخدام useLocation لقراءة البيانات المرسلة
import InvoiceContent from "../InvoiceContent";

const TripInvoicePage = () => {
  const location = useLocation();
  const { clientData, client, booking } = location.state || {}; // قراءة البيانات المرسلة

  // إذا لم تكن البيانات موجودة، عرض رسالة خطأ
  if (!clientData || !client || !booking) {
    return <div>خطأ: البيانات غير متوفرة</div>;
  }

  return (
    <div className="w-full">
      <InvoiceContent
        clientData={clientData}
        client={client}
        booking={booking}
      />
    </div>
  );
};

export default TripInvoicePage;
