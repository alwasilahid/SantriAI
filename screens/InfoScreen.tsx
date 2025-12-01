
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, BookOpen, FileText, Shield, AlertTriangle, Phone, Mail, Globe } from 'lucide-react';
import { APP_NAME } from '../constants';

const INFO_CONTENT: Record<string, { title: string, icon: any, content: React.ReactNode }> = {
  about: {
    title: 'Tentang Aplikasi',
    icon: Info,
    content: (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-6">
           <div className="w-20 h-20 bg-santri-green rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-green-200 dark:shadow-green-900/30">
              S
           </div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{APP_NAME}</h2>
           <p className="text-sm text-slate-500">Versi 1.0.0</p>
        </div>
        <p>
          {APP_NAME} adalah asisten cerdas bagi santri dan pelajar muslim untuk mempelajari Kitab Kuning (Turath), Al-Quran, dan Hadits dengan bantuan teknologi AI terkini.
        </p>
        <p>
          Aplikasi ini dirancang untuk memudahkan pemahaman teks-teks klasik dengan menyediakan terjemahan perkata (makna gandul), analisis gramatika (nahwu shorof), dan penjelasan kontekstual.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 mt-4">
           <strong>Visi Kami:</strong> Menjembatani tradisi keilmuan pesantren dengan teknologi modern untuk dakwah dan pendidikan Islam yang lebih luas.
        </div>
      </div>
    )
  },
  guide: {
    title: 'Panduan Penggunaan',
    icon: BookOpen,
    content: (
      <div className="space-y-6">
        <div className="space-y-2">
           <h3 className="font-bold text-slate-800 dark:text-slate-200">1. Menerjemahkan Teks</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Masuk ke menu "Input" atau tekan tombol keyboard di beranda. Anda bisa mengetik teks Arab, Indonesia, atau menggunakan kamera untuk memindai teks dari kitab.
           </p>
        </div>
        <div className="space-y-2">
           <h3 className="font-bold text-slate-800 dark:text-slate-200">2. Membedah Kitab</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Gunakan menu "Kitab" untuk mencari referensi kitab kuning. Anda bisa melihat daftar isi dan meminta AI menjelaskan bab tertentu secara mendalam.
           </p>
        </div>
        <div className="space-y-2">
           <h3 className="font-bold text-slate-800 dark:text-slate-200">3. Fitur Ibadah</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Manfaatkan fitur jadwal sholat, arah kiblat, tasbih digital, dan kalkulator zakat/waris untuk membantu ibadah harian Anda.
           </p>
        </div>
        <div className="space-y-2">
           <h3 className="font-bold text-slate-800 dark:text-slate-200">4. Tanya AI</h3>
           <p className="text-sm text-slate-600 dark:text-slate-400">
             Di menu Al-Quran atau Hadits, gunakan tombol "Bedah AI" atau kolom pencarian untuk bertanya tentang tafsir, asbabun nuzul, atau hukum terkait ayat/hadits tersebut.
           </p>
        </div>
      </div>
    )
  },
  terms: {
    title: 'Syarat & Ketentuan',
    icon: FileText,
    content: (
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <p>Dengan menggunakan aplikasi ini, Anda menyetujui ketentuan berikut:</p>
        <ul className="list-disc pl-5 space-y-2">
           <li>Aplikasi ini adalah alat bantu belajar. Hasil analisis AI mungkin tidak 100% akurat dan sebaiknya diverifikasi dengan rujukan asli atau guru/ustadz yang kompeten.</li>
           <li>Pengguna dilarang menggunakan aplikasi ini untuk tujuan yang bertentangan dengan hukum atau norma agama.</li>
           <li>Kami berhak memperbarui layanan dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
           <li>Penggunaan API Key pribadi adalah tanggung jawab pengguna sepenuhnya.</li>
        </ul>
      </div>
    )
  },
  privacy: {
    title: 'Kebijakan Privasi',
    icon: Shield,
    content: (
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <p>Kami menghargai privasi Anda.</p>
        <ul className="list-disc pl-5 space-y-2">
           <li><strong>Data Pribadi:</strong> Kami tidak mengumpulkan data pribadi sensitif tanpa izin Anda. Riwayat terjemahan disimpan secara lokal di perangkat Anda kecuali Anda mengaktifkan sinkronisasi cloud.</li>
           <li><strong>API & AI:</strong> Teks yang Anda kirimkan untuk analisis diproses oleh Google Gemini API sesuai dengan kebijakan privasi Google. Kami tidak menyimpan konten tersebut di server kami sendiri.</li>
           <li><strong>Lokasi:</strong> Izin lokasi hanya digunakan untuk menghitung jadwal sholat dan arah kiblat secara real-time di perangkat Anda.</li>
        </ul>
      </div>
    )
  },
  disclaimer: {
    title: 'Disclaimer',
    icon: AlertTriangle,
    content: (
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 mb-4 flex gap-3">
           <AlertTriangle size={24} className="shrink-0" />
           <p>Hasil terjemahan dan analisis yang dihasilkan oleh AI (Artificial Intelligence) dalam aplikasi ini hanya bersifat sebagai referensi pendamping belajar.</p>
        </div>
        <p>
          Ilmu agama Islam, khususnya yang berkaitan dengan hukum (Fiqih) dan Aqidah, harus dipelajari melalui guru (talaqqi) dan sanad keilmuan yang jelas.
        </p>
        <p>
          Pengembang tidak bertanggung jawab atas kesalahan interpretasi atau penggunaan informasi yang salah dari aplikasi ini. Selalu konsultasikan permasalahan agama yang kompleks kepada Ulama atau Ahli Fiqih yang terpercaya.
        </p>
      </div>
    )
  },
  contact: {
    title: 'Hubungi Kami',
    icon: Phone,
    content: (
      <div className="space-y-6">
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          Punya pertanyaan, saran, atau ingin melaporkan bug? Hubungi tim pengembang kami.
        </p>
        
        <div className="space-y-3">
           <a href="mailto:support@santriai.com" className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-green-500 transition-colors">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center">
                 <Mail size={20} />
              </div>
              <div>
                 <h4 className="font-bold text-slate-800 dark:text-slate-100">Email</h4>
                 <p className="text-sm text-slate-500">support@santriai.com</p>
              </div>
           </a>

           <a href="https://santriai.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-green-500 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center">
                 <Globe size={20} />
              </div>
              <div>
                 <h4 className="font-bold text-slate-800 dark:text-slate-100">Website</h4>
                 <p className="text-sm text-slate-500">www.santriai.com</p>
              </div>
           </a>
        </div>
      </div>
    )
  }
};

const InfoScreen: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const info = slug && INFO_CONTENT[slug] ? INFO_CONTENT[slug] : null;

  if (!info) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
            <p className="text-slate-500 mb-4">Halaman tidak ditemukan.</p>
            <button onClick={() => navigate(-1)} className="text-santri-green font-bold">Kembali</button>
        </div>
    );
  }

  const Icon = info.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
           {info.title}
        </h2>
      </div>

      <div className="p-6 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
               <Icon size={32} />
            </div>
         </div>
         
         <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
            {info.content}
         </div>
      </div>
    </div>
  );
};

export default InfoScreen;
