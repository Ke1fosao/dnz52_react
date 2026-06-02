import { Seo } from '@/components/common/Seo';
import { HeroSlider } from '@/components/home/HeroSlider';
import { KineticMarquee } from '@/components/home/KineticMarquee';
import { AdvancedBento } from '@/components/home/AdvancedBento';
import { NewsSection } from '@/components/home/NewsSection';
import { Philosophy } from '@/components/home/Philosophy';

export function HomePage() {
  return (
    <>
      <Seo
        title="Головна"
        description="Заклад дошкільної освіти №52, м. Рівне — простір, де кожен день перетворюється на захопливу пригоду."
      />
      <HeroSlider />
      <KineticMarquee />
      <AdvancedBento />
      <NewsSection />
      <Philosophy />
    </>
  );
}
