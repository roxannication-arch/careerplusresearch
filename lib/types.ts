export type ExperienceLevel =
  | "Junior 0-2yr"
  | "Middle 2-5yr"
  | "Senior 5+yr"
  | "Lead";

export type VacancyStatus = "Active" | "Expired" | "Unverified";
export type PriorityLevel = "High" | "Medium" | "Low";

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
  title_groups: {
    standard: string[];
    niche: string[];
    senior: string[];
  };
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
  company_priority: {
    large_tech: {
      priority: PriorityLevel;
      remote_friendly: string[];
      local: string[];
    };
    design_agencies: {
      priority: PriorityLevel;
      remote_friendly: string[];
      local: string[];
    };
    startups: {
      priority: PriorityLevel;
      remote_friendly: string[];
      local: string[];
    };
    saas_marketing: {
      priority: PriorityLevel;
      remote_friendly: string[];
      local: string[];
    };
    staffing_agencies: {
      priority: PriorityLevel;
      remote_friendly: string[];
      local: string[];
    };
  };
  vacancies: Array<{
    company: string;
    title: string;
    url: string;
    type: "Remote" | "Hybrid" | "Onsite";
    status: VacancyStatus;
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
    profile_notes: string;
  }>;
  stop_list: string[];
  section_notes: {
    title_groups: string;
    job_titles: string;
    companies: string;
    vacancies: string;
    salary: string;
    requirements: string;
    profiles: string;
    strategy: string;
    stop_list: string;
  };
  strategy: {
    connections_target: string;
    applications_target: string;
    notes: string;
  };
};

