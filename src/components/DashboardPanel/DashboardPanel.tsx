import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./DashboardPanel.css";
export default function DashboardPanel({title,subtitle,link,id,children,className=""}:{title:string;subtitle?:string;link?:string;id?:string;children:ReactNode;className?:string}) {
  return <section id={id} className={"workspace-card dashboard-panel "+className}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{link && <Link to={link}>Ver todos →</Link>}</header>{children}</section>;
}
