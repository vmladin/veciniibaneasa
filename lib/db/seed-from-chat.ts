/**
 * Seeds service providers extracted from the Vecinii Baneasa WhatsApp group chat.
 * Run with: npx ts-node -e "require('./lib/db/seed-from-chat.ts')"
 * Or: npx tsx lib/db/seed-from-chat.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { providers } from "./schema";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Category IDs from DB:
// 1=electrician, 2=plumber (Instalator), 3=ac-heating, 4=fridge-appliances
// 5=gardener, 6=rug-cleaning, 7=cleaning, 8=doctor, 9=dentist
// 10=handyman, 11=painter, 12=car-repair, 13=locksmith, 14=pest-control, 15=other

const PROVIDERS = [
  // ── Instalatori ─────────────────────────────────────────────────────────────
  {
    name: "Marius Florea – Instalator",
    phone: "0745149042",
    whatsapp: "40745149042",
    description: "Instalator recomandat de vecini pentru intervenții sanitare și canalizare. Disponibil în zona Băneasa.",
    services: "Instalații sanitare, deblocat canalizare, reparații țevi",
    zone: "Băneasa, Sector 1",
    categoryId: 2,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Adrian – Instalator",
    phone: "0786621705",
    whatsapp: "40786621705",
    description: "Instalator recomandat de vecini pentru urgențe sanitare și canalizare.",
    services: "Instalații sanitare, canalizare, reparații urgențe",
    zone: "Băneasa, Sector 1",
    categoryId: 2,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Ionuț – Instalator Centrale",
    phone: "0728632803",
    whatsapp: "40728632803",
    description: "Specialist în instalații de gaze și centrale termice, recomandat de vecini.",
    services: "Instalații gaze, centrale termice, robineți gaze",
    zone: "Băneasa, Sector 1",
    categoryId: 3,
    addedByNickname: "Import chat grup",
  },
  // ── Centrale termice / AC ────────────────────────────────────────────────────
  {
    name: "Teo – Centrale Termice și Arzătoare",
    phone: "0729177594",
    whatsapp: "40729177594",
    description: "Servicii de instalare și reparare centrale termice și arzătoare, recomandat cu căldură de vecini.",
    services: "Centrale termice, arzătoare, instalații gaze, autorizat ANRE",
    zone: "Sector 1, București",
    categoryId: 3,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Radu Popescu – Reparații Centrale",
    phone: "0727776093",
    whatsapp: "40727776093",
    description: "Tehnicianul de încredere recomandat de vecini pentru reparații centrale termice.",
    services: "Reparații centrale termice, service, revizii",
    zone: "Sector 1, București",
    categoryId: 3,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Eugen – Service Centrale Termice",
    phone: "0762721306",
    whatsapp: "40762721306",
    description: "Specialist în repararea și întreținerea centralelor termice, inclusiv Viessmann.",
    services: "Reparații centrale Viessmann, service central termice",
    zone: "Sector 1, București",
    categoryId: 3,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Valentin – Centrale Autorizat ANRE",
    phone: "0722614895",
    whatsapp: "40722614895",
    description: "Firmă autorizată ANRE pentru reparații și instalații centrale termice Motan și alte mărci.",
    services: "Centrale Motan, instalații termice, autorizat ANRE, reparații urgente",
    zone: "Sector 1, București",
    categoryId: 3,
    addedByNickname: "Import chat grup",
  },
  // ── Electrocasnice ───────────────────────────────────────────────────────────
  {
    name: "Reparații Mașini de Spălat – La Domiciliu",
    phone: "0770955208",
    whatsapp: "40770955208",
    description: "Serviciu de reparații mașini de spălat rufe la domiciliu, recomandat de vecini.",
    services: "Reparații mașini de spălat, service electrocasnice la domiciliu",
    zone: "Băneasa, Sector 1",
    categoryId: 4,
    addedByNickname: "Import chat grup",
  },
  // ── Masaj & Wellness ─────────────────────────────────────────────────────────
  {
    name: "Masaj Magda",
    phone: "0726549408",
    whatsapp: "40726549408",
    description: "Terapeut de masaj recomandat de vecini, inclusiv drenaj limfatic la domiciliu. Recomandată de vecini.",
    services: "Masaj, drenaj limfatic, masaj la domiciliu, zona Băneasa",
    zone: "Băneasa",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Daniela – Masaj & Drenaj Limfatic",
    phone: "0722375631",
    whatsapp: "40722375631",
    description: "Terapeut de masaj la domiciliu, specializată în drenaj limfatic, recomandată de vecini.",
    services: "Masaj, drenaj limfatic, masaj la domiciliu",
    zone: "Băneasa, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Iza Leca – Masaj & Terapii",
    phone: "0765247968",
    whatsapp: "40765247968",
    description: "Terapeut cu experienta de peste 15 ani, recomandată cu caldura de vecini. Stie multe tehnici: drenaj limfatic, masaj fascial, reflexoterapie, masaj de relaxare, reiki.",
    services: "Drenaj limfatic, masaj fascial, reflexoterapie, masaj relaxare, reiki",
    zone: "Băneasa, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Sergiu Alexandriu – Drenaj Limfatic & Reflexoterapie",
    phone: "0763600302",
    whatsapp: "40763600302",
    description: "Kinetoterapeut/terapeut specializat în drenaj limfatic și reflexoterapie, recomandat de vecini.",
    services: "Drenaj limfatic, reflexoterapie",
    zone: "Băneasa, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Iuliana (Costin) – Masaj la Domiciliu",
    phone: "0768766503",
    whatsapp: "40768766503",
    description: "Masaj la domiciliu în zona Băneasa, recomandat de vecini.",
    services: "Masaj la domiciliu",
    zone: "Băneasa",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  // ── Beauty ───────────────────────────────────────────────────────────────────
  {
    name: "Azar Beauty Concept",
    phone: "0754211021",
    whatsapp: "40754211021",
    description: "Salon de frumusete din cartier, recomandat de vecini: Recomand cu drag! Atmosfera placuta, servicii pe masura! Echipa de manichiurista si coafor.",
    services: "Manichiură, gel unghii, coafat, servicii beauty",
    zone: "Băneasa",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "House of Aya",
    phone: "",
    description: "Centru de wellness și beauty în cartierul Băneasa, pe Madrigalului 58.",
    services: "Beauty, wellness, îngrijire",
    address: "Madrigalului 58, București",
    zone: "Băneasa",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  // ── Topografie ───────────────────────────────────────────────────────────────
  {
    name: "Ciprian Manolache – Topograf",
    phone: "0740970762",
    whatsapp: "40740970762",
    description: "Topograf recomandat de vecini cu toată încrederea.",
    services: "Topografie, cadastru, măsurători teren",
    zone: "Sector 1, București",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Hruza Victor – Topograf",
    phone: "0747098098",
    whatsapp: "40747098098",
    description: "Topograf super profesionist, recomandat de vecini.",
    services: "Topografie, cadastru, măsurători teren",
    zone: "Sector 1, București",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  // ── Meșter / Construcții ─────────────────────────────────────────────────────
  {
    name: "D-l Epure – Vopsele Epoxidice & Membrane",
    phone: "0743213555",
    whatsapp: "40743213555",
    description: "Mester recomandat cu toata increderea: Foarte serios si prompt. Aplica membrane si vopsele epoxidice.",
    services: "Vopsea epoxidică, membrane impermeabilizare, finisaje",
    zone: "Sector 1, București",
    categoryId: 10,
    addedByNickname: "Import chat grup",
  },
  // ── Notari ───────────────────────────────────────────────────────────────────
  {
    name: "Notar cu Deplasare – Șișești",
    phone: "0769231891",
    whatsapp: "40769231891",
    description: "Notar care se deplasează, recomandat de vecini pentru zona Șișești.",
    services: "Servicii notariale, deplasare la domiciliu",
    zone: "Șișești, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Notar Lazar Daniela",
    phone: "",
    description: "Cabinet notarial pe Bulevardul Aerogării 22 (în stație, pe colț), recomandat de vecini.",
    services: "Servicii notariale",
    address: "Bulevardul Aerogării 22, Sector 1, București",
    zone: "Băneasa, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
  // ── Medicii & Clinici ────────────────────────────────────────────────────────
  {
    name: "Bio-Ortoclinic",
    phone: "",
    description: "Clinică de recuperare medicală pe Șișești, recomandată de vecini. Acceptă bilete de trimitere.",
    services: "Recuperare medicală, kinetoterapie, bilet de trimitere acceptat",
    zone: "Șișești, Sector 1",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Active Life Therapy – Centru Medical și de Recuperare",
    phone: "",
    website: "https://share.google/CSwm5ltb6kYaCYNm4",
    description: "Centru medical și de recuperare recomandat de vecini pentru kinetoterapie și recuperare.",
    services: "Kinetoterapie, recuperare medicală, fizioterapie",
    zone: "Sector 1, București",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Enayati Medical City",
    phone: "",
    description: "Clinică medicală completă în zona Băneasa. Recomandată de vecini pentru recuperare (cu bilet de trimitere), consultații și chiar mâncare proaspătă la restaurantul lor.",
    services: "Consultații medicale, recuperare, bilet de trimitere, restaurant",
    zone: "Băneasa, Sector 1",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Dr. Luminița Teodorescu – Oftalmolog",
    phone: "",
    website: "https://share.google/LgY81Rd828B63sgf4",
    description: "Medic oftalmolog la Clinica Oftalmologica Oftalmix, pe Nicolae Caramfil. Recomandată de vecini.",
    services: "Oftalmologie, consultații, investigații ochi",
    address: "Strada Nicolae Caramfil, Sector 1",
    zone: "Aviatorilor, Sector 1",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Dr. Ladea Lidia – Oftalmolog",
    phone: "0742277177",
    description: "Medic oftalmolog la Spitalul Clinic de Urgențe Oftalmologice, Piața Lahovari. Telefon personal, recomandată de vecini.",
    services: "Oftalmologie urgențe, consultații",
    address: "Piața Charles de Gaulle (Lahovari), Sector 1",
    zone: "Aviatorilor, Sector 1",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  {
    name: "Dr. Anghel Medical Center – ORL",
    phone: "",
    website: "https://www.anghelclinic.ro",
    description: "Prof. Dr. Anghel (de la Spitalul Militar), clinic privat cu servicii ORL, chirurgie plastică și ob-ginecologie. Recomandat de vecini pentru probleme sinusuri.",
    services: "ORL, chirurgie plastică, ob-ginecologie, sinusuri",
    zone: "Sector 1, București",
    categoryId: 8,
    addedByNickname: "Import chat grup",
  },
  // ── Grădinărit ───────────────────────────────────────────────────────────────
  {
    name: "Nadja – Amenajări Grădini",
    phone: "",
    website: "https://www.nadja.ro",
    description: "Firmă de amenajare grădini recomandată de vecini.",
    services: "Amenajare grădini, peisagistică, întreținere spații verzi",
    zone: "Băneasa, Sector 1",
    categoryId: 5,
    addedByNickname: "Import chat grup",
  },
  // ── Sport ────────────────────────────────────────────────────────────────────
  {
    name: "North District Fitness – Sala Șișești",
    phone: "",
    description: "Sala de fitness pe Sisesti, recomandata de vecini: Curata, aerisita. Exista antrenori personali disponibili.",
    services: "Fitness, antrenori personali, sala de sport",
    zone: "Șișești, Sector 1",
    categoryId: 15,
    addedByNickname: "Import chat grup",
  },
];

async function main() {
  console.log(`Inserting ${PROVIDERS.length} providers...`);
  let ok = 0;
  let skip = 0;
  for (const p of PROVIDERS) {
    try {
      await db.insert(providers).values({
        name: p.name,
        phone: p.phone ?? null,
        whatsapp: p.whatsapp ?? null,
        email: null,
        description: p.description,
        services: p.services ?? null,
        priceRange: null,
        hours: null,
        zone: p.zone ?? null,
        website: p.website ?? null,
        social: null,
        categoryId: p.categoryId,
        address: p.address ?? null,
        lat: null,
        lng: null,
        addedByNickname: p.addedByNickname,
      });
      console.log(`✓ ${p.name}`);
      ok++;
    } catch (e: any) {
      console.error(`✗ ${p.name}: ${e.message}`);
      skip++;
    }
  }
  console.log(`\nDone: ${ok} inserted, ${skip} failed.`);
  process.exit(0);
}

main();
