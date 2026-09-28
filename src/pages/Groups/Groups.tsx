import Navbar from "../../components/Navbar/Navbar";
import "./Groups.css";

function Groups() {
  return (
    <>
      <Navbar />
      <main className="groups" aria-labelledby="groups-title">
        <h1 id="groups-title">Grupos</h1>
      </main>
    </>
  );
}

export default Groups;
