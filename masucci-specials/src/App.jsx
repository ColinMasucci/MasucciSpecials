import { BrowserRouter, Routes, Route } from "react-router-dom";
import Host from "./Host.jsx";
import Player from "./Player.jsx";


function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Host />} />
                <Route path="/host" element={<Host />} />
                <Route path="/player" element={<Player />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
