import { useLibraryStore } from "../store/libraryStore";
import CollectionPage from "../components/CollectionPage";

export default function History() {
    const history = useLibraryStore((s) => s.history);
    const clearHistory = useLibraryStore((s) => s.clearHistory);

    return (
        <CollectionPage
            title="History"
            subtitle="Terakhir diputar (maks. 50 lagu)"
            tracks={history}
            actions={
                history.length > 0 ? (
                    <button className="text-btn" onClick={clearHistory}>
                        Hapus history
                    </button>
                ) : null
            }
        />
    );
}