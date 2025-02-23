import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// تعريف الأنماط
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  details: {
    marginTop: 20,
  },
  detailItem: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1px solid #ddd",
    textAlign: "center",
    fontSize: 12,
    color: "#777",
  },
  logo: {
    width: 100,
    marginBottom: 10,
  },
});

const InvoicePDF = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* رأس الفاتورة */}
      <View style={styles.header}>
        <Text style={styles.title}>فاتورة الرحلة</Text>
        <Text style={styles.subtitle}>
          تاريخ الفاتورة: {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* تفاصيل الفاتورة */}
      <View style={styles.details}>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>رقم الرحلة:</Text>{" "}
          {booking.tripNumber}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>التاريخ:</Text>{" "}
          {new Date(booking.date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>شركة التأجير:</Text>{" "}
          {booking.leasingCompany}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>تكلفة الرحلة:</Text>{" "}
          {booking.totalTripCost} ريال
        </Text>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>المبلغ المدفوع:</Text>{" "}
          {booking.totalTripPaid} ريال
        </Text>
        <Text style={styles.detailItem}>
          <Text style={{ fontWeight: "bold" }}>صافي المبلغ:</Text>{" "}
          {booking.totalTripNetAmount} ريال
        </Text>
      </View>

      {/* تذييل الفاتورة */}
      <View style={styles.footer}>
        <Image
          src="https://via.placeholder.com/100x50?text=شعار+الشركة"
          style={styles.logo}
        />
        <Text style={{ fontWeight: "bold" }}>شركة النقل السريع</Text>
        <Text>العنوان: الرياض، المملكة العربية السعودية</Text>
        <Text>هاتف: 0112345678</Text>
        <Text>البريد الإلكتروني: info@company.com</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
