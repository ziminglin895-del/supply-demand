import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import SupplyList from "@/pages/SupplyList"
import DemandList from "@/pages/DemandList"
import Publish from "@/pages/Publish"
import Matches from "@/pages/Matches"
import PostDetail from "@/pages/PostDetail"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/supply" element={<SupplyList />} />
          <Route path="/demand" element={<DemandList />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}