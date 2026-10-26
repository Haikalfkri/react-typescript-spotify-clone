import { useLibraryStore } from "../store/libraryStore";
import CollectionPage from "../components/CollectionPage";

export default function Liked() {
    const liked = useLibraryStore((s) => s.liked);
    const toggleLike = useLibraryStore((s) => s.toggleLike);

    return (
        <CollectionPage
            title="Liked Songs"
            subtitle={`${liked.length} lagu`}
            tracks={liked}
            onRemove={toggleLike}
        />
    )
}