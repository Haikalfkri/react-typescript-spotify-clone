import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import LyricsView from "./components/LyricsView";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Liked from "./pages/Liked";
import History from "./pages/History";
import PlaylistPage from "./pages/PlaylistPage";
import LocalFiles from "./pages/LocalFiles";
import LyricSearch from "./pages/LyricSearch";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/liked" element={<Liked />} />
            <Route path="/history" element={<History />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/local" element={<LocalFiles />} />
            <Route path="/lyric-search" element={<LyricSearch />} />
          </Routes>
        </main>
        <Player />
        <LyricsView />
      </div>
    </BrowserRouter>
  );
}