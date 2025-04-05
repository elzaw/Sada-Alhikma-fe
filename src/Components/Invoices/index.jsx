import React, { useState } from "react";
import InvoiceForm from "./InvoiceForm";
import InvoicePreview from "./InvoicePreview";
const InvoicePage = () => {
  const [clientData, setClientData] = useState(null);

  const handleFormSubmit = (data) => {
    console.log(data); // تأكد من أن البيانات تصل هنا
  };

  return (
    <div className="p-6">
      <InvoiceForm onSubmit={handleFormSubmit} />
      {clientData && <InvoicePreview clientData={clientData} />}
    </div>
  );
};

export default InvoicePage;
