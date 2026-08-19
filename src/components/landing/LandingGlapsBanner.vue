<template>
  <section class="relative flex min-h-[72vh] w-full items-center overflow-hidden border-y border-gray-800 bg-black">
    <video
      class="absolute inset-0 h-full w-full object-cover"
      autoplay
      muted
      loop
      playsinline
    >
      <source src="/glaps-bg-video.mp4" type="video/mp4" />
    </video>
    <div class="absolute inset-0 bg-black/10" aria-hidden="true" />

    <div class="relative z-10 mx-auto w-full max-w-[1160px] px-6 py-14 md:px-10 md:py-20">
      <div class="max-w-[920px] text-left">
        <p class="glaps-eyebrow">
          AI HIGHLIGHT ENGINE · RACKET &amp; PADDLE SPORTS
        </p>

        <h2 class="glaps-headline">
          <span class="glaps-line">CAPTURE EVERY</span>
          <br>
          <span class="glaps-line glaps-lime">HIGHLIGHT</span>
          <br>
          <span class="glaps-line">
            WITH <span class="glaps-outline">ZERO EFFORT</span>
          </span>
        </h2>

        <a
          href="https://glaps.ai/"
          target="_blank"
          rel="noopener noreferrer"
          class="glaps-btn"
        >
          <span>GO TO GLAPS.AI</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.glaps-eyebrow,
.glaps-eyebrow * {
  font-family: 'Cascadia Code', Consolas, 'SF Mono', ui-monospace, monospace !important;
}

.glaps-headline,
.glaps-headline *,
.glaps-btn,
.glaps-btn * {
  font-family: 'Haettenschweiler', 'Impact', 'Anton', 'Arial Narrow', sans-serif !important;
  font-weight: 400;
  font-style: normal;
  font-synthesis: none;
}

.glaps-body,
.glaps-body * {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
}

.glaps-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #84cc16;
}

.glaps-eyebrow::before {
  content: '';
  width: 34px;
  height: 2px;
  border-radius: 2px;
  background: #84cc16;
}

.glaps-headline {
  font-size: clamp(64px, 11vw, 148px);
  letter-spacing: 0.04em;
  line-height: 0.88;
  text-transform: uppercase;
  color: #f4f6ec;
}

.glaps-line {
  display: inline-block;
  white-space: nowrap;
  transform: skew(-8deg);
}

.glaps-lime {
  color: #84cc16;
}

.glaps-outline {
  color: transparent;
  -webkit-text-stroke: 2.5px #f4f6ec;
}

.glaps-body {
  max-width: 56ch;
  margin-top: 24px;
  font-size: 18px;
  line-height: 1.6;
  color: #a8ac9b;
}

.glaps-body strong {
  color: #f4f6ec;
  font-weight: 600;
}

.glaps-btn {
  display: inline-block;
  margin-top: 32px;
  padding: 8px 20px 6px;
  border: none;
  border-radius: 8px;
  background: #84cc16;
  color: #070707;
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transform: skew(-8deg);
  transition: background 0.15s;
}

.glaps-btn > span {
  display: inline-block;
  transform: skew(8deg);
}

.glaps-btn:hover {
  background: #a3e635;
}

@media (max-width: 640px) {
  .glaps-headline {
    font-size: clamp(56px, 9.5vw, 148px);
  }

  .glaps-btn {
    display: flex;
    width: 100%;
    justify-content: center;
  }

  .glaps-outline {
    -webkit-text-stroke-width: 1.8px;
  }
}
</style>
