import React from "react";
import Hero from "./Hero";
import FeatureCards from "./FeatureCards";
import MoodTracker from "./MoodTracker";
import CardSection from "./CardSection";
import TarotCards from "./TarotCards";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";
import Disclaimer from "./Disclaimer";
import Footer from "./Footer";
import Navbar from "./Navbar";

const Home = () => {
  return (
    <>
        <section id="hero" className="scroll-mt-24">
          <Hero />
        </section>
        <section id="features" className="scroll-mt-24">
          <FeatureCards />
        </section>
        <div id="mood-tracker" className="scroll-mt-24">
          <MoodTracker />
        </div>
        <section id="tarot" className="scroll-mt-24">
          <CardSection />
        </section>
        <section id="zodiac" className="scroll-mt-24">
          <TarotCards />
        </section>
      <TestimonialsSection />
      <FAQSection />
      <Disclaimer />
    </>
  );
};

export default Home;
