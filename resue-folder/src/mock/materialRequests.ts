export type MaterialRequestStatus = "Approved" | "Draft" | "For revisal" | "Cancelled";

export type MaterialRequest = {
  id: number;
  date: string;
  requestFor: string;
  forCenter: string;
  employee: string;
  dueDate: string | null;
  status: MaterialRequestStatus;
};

export const materialRequestsMock: MaterialRequest[] = [
  { id: 21, date: "31 Aug 2021, 9:36 AM", requestFor: "Custom", forCenter: "Tirur", employee: "Riza Asif", dueDate: "30 Aug 2021, 10:30 PM", status: "Approved" },
  { id: 20, date: "11 Aug 2021, 7:45 PM", requestFor: "Purchase Order", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Approved" },
  { id: 18, date: "11 Aug 2021, 4:22 PM", requestFor: "Custom", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Approved" },
  { id: 17, date: "11 Aug 2021, 2:15 PM", requestFor: "Custom", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Cancelled" },
  { id: 16, date: "11 Aug 2021, 2:10 PM", requestFor: "Custom", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Cancelled" },
  { id: 15, date: "11 Aug 2021, 2:07 PM", requestFor: "Custom", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Approved" },
  { id: 14, date: "11 Aug 2021, 10:59 AM", requestFor: "Purchase Order", forCenter: "Tirur", employee: "Riza Asif", dueDate: null, status: "Approved" },
  { id: 13, date: "10 Aug 2021, 9:59 PM", requestFor: "Custom", forCenter: "Tirur", employee: "Steve John", dueDate: null, status: "Approved" },
];
