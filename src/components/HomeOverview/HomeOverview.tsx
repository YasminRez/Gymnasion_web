import "./HomeOverview.css";
function HomeOverview({ name = "@personal" }: { name?: string }) {
  return <section className="home-overview" aria-labelledby="home-greeting">
    <h1 id="home-greeting">Olá, {name}</h1>
    <section className="home-overview__welcome" aria-labelledby="home-welcome-title">
      <h2 id="home-welcome-title">Seja bem-vindo!</h2>
    </section>
  </section>;
}
export default HomeOverview;
