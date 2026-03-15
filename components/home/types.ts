export type Expense = {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
};

export type ReportType = "weekly" | "monthly" | "yearly";
