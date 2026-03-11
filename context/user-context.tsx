import React, { createContext, useContext, useState } from "react";

export interface Profile {
  name: string;
  persona: string;
  monthlyIncome: number;
  salaryDay: number;
  riskLevel: string;
  baseCurrency: string;
}

interface UserContextType {
  answers: Record<string, string | string[] | number | boolean>;
  setAnswers: (
    answers: Record<string, string | string[] | number | boolean>,
  ) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  userName: string;
  monthlyIncome: number;
  monthlySpent: number;
  addExpense: (amount: number) => void;
  resetSpent: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_PROFILE: Profile = {
  name: "User",
  persona: "Student",
  monthlyIncome: 0,
  salaryDay: 1,
  riskLevel: "Moderate",
  baseCurrency: "INR",
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | number | boolean>
  >({});
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  const userName = profile.name || (answers.user_name as string) || "";
  const monthlyIncome =
    profile.monthlyIncome || (answers.monthly_income as number) || 0;

  const addExpense = (amount: number) => {
    setMonthlySpent((prev) => prev + amount);
  };

  const resetSpent = () => {
    setMonthlySpent(0);
  };

  return (
    <UserContext.Provider
      value={{
        answers,
        setAnswers,
        profile,
        setProfile,
        userName,
        monthlyIncome,
        monthlySpent,
        addExpense,
        resetSpent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
