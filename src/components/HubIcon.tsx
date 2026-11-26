import approval from "@/assets/hub-icons/approval.png.asset.json";
import book from "@/assets/hub-icons/book.png.asset.json";
import briefcase from "@/assets/hub-icons/briefcase.png.asset.json";
import calendar from "@/assets/hub-icons/calendar.png.asset.json";
import cancel from "@/assets/hub-icons/cancel.png.asset.json";
import buildings from "@/assets/hub-icons/city-buildings.png.asset.json";
import clipboard from "@/assets/hub-icons/clipboard.png.asset.json";
import clock from "@/assets/hub-icons/clock.png.asset.json";
import complaint from "@/assets/hub-icons/complaint.png.asset.json";
import users from "@/assets/hub-icons/conference.png.asset.json";
import document from "@/assets/hub-icons/document.png.asset.json";
import edit from "@/assets/hub-icons/edit-file.png.asset.json";
import folder from "@/assets/hub-icons/folder-invoices.png.asset.json";
import law from "@/assets/hub-icons/law.png.asset.json";
import chart from "@/assets/hub-icons/pie-chart.png.asset.json";
import search from "@/assets/hub-icons/search.png.asset.json";
import shield from "@/assets/hub-icons/security-shield-green.png.asset.json";
import cartas from "@/assets/icone-cartas.png";
import prioridade from "@/assets/Icone-prioridade.png";
import relatorio from "@/assets/icone-relatorio..jpg";
import { cn } from "@/lib/utils";

const icons = {
  approval: approval.url,
  book: book.url,
  briefcase: briefcase.url,
  calendar: calendar.url,
  cancel: cancel.url,
  buildings: buildings.url,
  clipboard: clipboard.url,
  clock: clock.url,
  complaint: complaint.url,
  users: users.url,
  document: document.url,
  edit: edit.url,
  folder: folder.url,
  law: law.url,
  chart: chart.url,
  search: search.url,
  shield: shield.url,
  cartas,
  prioridade,
  relatorio,
};

export function HubIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  return <img src={icons[name]} alt="" aria-hidden="true" draggable={false} className={cn("h-8 w-8 shrink-0 object-contain", className)} />;
}