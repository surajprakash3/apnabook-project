import React from 'react'
import Navbar from '../component/Navbar'
import Banner from '../component/Banner'
import Freebook from '../component/FreeBook'
import Footer from '../component/Footer'

function Home() {
  return (
    <div>
         <Navbar/>
    <Banner/>
    <Freebook/>
    <Footer/>
    </div>
  )
}

export default Home