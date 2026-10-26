import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import type { Track } from "../types";
import { useLocalStore } from "../store/localStore";
import { importLocalFile, isAudioFile } from "../services/localFiles";
import CollectionPage from "../components/CollectionPage";

export default function LocalFiles() {
  const tracks = useLocalStore((s) => s.tracks);
  const addTracks = useLocalStore((s) => s.addTracks);
  const removeTrack = useLocalStore((s) => s.removeTrack);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset supaya file yang sama bisa dipilih lagi
    if (files.length === 0) return;

    setBusy(true);
    setMessage("");

    // minta browser agar tidak menghapus data otomatis saat storage penuh
    void navigator.storage?.persist?.();

    const added: Track[] = [];
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setMessage(`Memproses ${i + 1}/${files.length}: ${file.name}`);

      if (!isAudioFile(file)) {
        failed++;
        continue;
      }
      try {
        added.push(await importLocalFile(file));
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    addTracks(added);
    setBusy(false);
    setMessage(
      `${added.length} lagu ditambahkan` + (failed ? `, ${failed} file gagal/dilewati.` : ".")
    );
  };

  return (
    <CollectionPage
      title="File Lokal"
      subtitle={`${tracks.length} lagu • tersimpan di browser ini`}
      tracks={tracks}
      onRemove={removeTrack}
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept="audio/*,.mp3,.m4a,.flac,.wav,.ogg,.opus"
            onChange={handleFiles}
          />
          <button
            className="upload-btn"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={18} /> {busy ? "Memproses…" : "Tambah file"}
          </button>
          {message && <span className="upload-msg">{message}</span>}
        </>
      }
    />
  );
}