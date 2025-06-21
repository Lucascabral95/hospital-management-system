import { DiagnosisCategory } from "@prisma/client";
import { CreateDiagnosisSingleDto } from "src/interment/dto";

export const diagnosis: CreateDiagnosisSingleDto[] = [
  {
    intermentId: 1,
    description: "Diabetes mellitus tipo 2 descompensada",
    code: "E11.9",
    category: DiagnosisCategory.COMORBIDITY,
  },
  {
    intermentId: 2,
    description: "Neumonía adquirida en la comunidad",
    code: "J18.9",
    category: DiagnosisCategory.COMPLICATION,
  },
  {
    intermentId: 3,
    description: "Insuficiencia renal aguda",
    code: "N17.9",
    category: DiagnosisCategory.COMPLICATION,
  },
  {
    intermentId: 4,
    description: "Hipertensión arterial esencial",
    code: "I10",
    category: DiagnosisCategory.COMORBIDITY,
  },
  {
    intermentId: 5,
    description: "Sepsis secundaria a infección urinaria",
    code: "A41.9",
    category: DiagnosisCategory.COMPLICATION,
  },
  {
    intermentId: 6,
    description: "Fractura de fémur cerrada",
    code: "S72.0",
    category: DiagnosisCategory.COMPLICATION,
  },
  {
    intermentId: 7,
    description: "EPOC exacerbado",
    code: "J44.1",
    category: DiagnosisCategory.COMORBIDITY,
  },
  {
    intermentId: 8,
    description: "Accidente cerebrovascular isquémico",
    code: "I63.9",
    category: DiagnosisCategory.COMPLICATION,
  },
  {
    intermentId: 9,
    description: "Insuficiencia cardíaca congestiva",
    code: "I50.9",
    category: DiagnosisCategory.COMORBIDITY,
  },
  {
    intermentId: 10,
    description: "Neutropenia febril post-quimioterapia",
    code: "D70.9",
    category: DiagnosisCategory.COMPLICATION,
  },
];
