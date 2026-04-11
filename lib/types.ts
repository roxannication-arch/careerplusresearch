export type ExperienceLevel =
  | "Junior 0-2yr"
  | "Middle 2-5yr"
  | "Senior 5+yr"
  | "Lead";

export type ResearchPayload = {
  clientName: string;
  specialty: string;
  targetRole: string;
  location: string;
  experience: ExperienceLevel;
  notes?: string;
  resumeText?: string;
};

export type ResearchReport = {
  titles: Array<{
    title: string;
    responsibilities: string;
  }>;
  companies: {
    large_tech: string[];
    design_agencies: string[];
    startups: string[];
    saas_marketing: string[];
    staffing_agencies: string[];
  };
  vacancies: Array<{
    company: string;
    title: string;
    url: string;
    type: "Remote" | "Hybrid" | "Onsite";
    notes: string;
  }>;
  salary: {
    min: string;
    max: string;
    average: string;
    notes: string;
  };
  requirements: {
    core_responsibilities: string[];
    core_requirements: string[];
    nice_to_have: string[];
  };
  profiles: Array<{
    url: string;
    notes: string;
  }>;
  strategy: {
    connections_target: string;
    applications_target: string;
    notes: string;
  };
};

