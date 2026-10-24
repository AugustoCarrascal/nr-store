import { MessageCircle } from "lucide-react";
import { STORE } from "@/lib/config";

export default function FloatingContact() {
  const whatsappHref = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(STORE.whatsappMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href={STORE.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shadow-lg shadow-black/40 transition hover:scale-110"
      >
        {/* SVG propio: no dependemos de que la librería de íconos incluya marcas */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      </a>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition hover:scale-110"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}