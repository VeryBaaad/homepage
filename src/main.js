import './style.css'

function createRipple(event) {
  const el = event.currentTarget

  let container = el.querySelector('.m3-ripple-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'm3-ripple-container'

    const computed = getComputedStyle(el).position
    if (computed === 'static') {
      el.style.position = 'relative'
    }

    if (getComputedStyle(el).overflow === 'visible') {
      el.style.overflow = 'hidden'
    }
    el.appendChild(container)
  }

  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const ripple = document.createElement('div')
  ripple.className = 'm3-ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`

  container.appendChild(ripple)

  ripple.addEventListener('animationend', () => ripple.remove())
}

function initRipples() {
  const rippleTargets = document.querySelectorAll(
    '.m3-button, .m3-icon-button, .m3-fab, .m3-nav-item, .m3-chip, .m3-project-card'
  )
  rippleTargets.forEach(el => {
    el.addEventListener('pointerdown', createRipple)
  })
}

class TypingEffect {
  constructor(element, strings, options = {}) {
    this.el = element
    this.strings = strings
    this.typeSpeed = options.typeSpeed || 80
    this.backSpeed = options.backSpeed || 40
    this.startDelay = options.startDelay || 500
    this.backDelay = options.backDelay || 2500
    this.loop = options.loop !== false

    this.strIndex = 0
    this.charIndex = 0
    this.isDeleting = false
    this.timeout = null
  }

  start() {
    setTimeout(() => this._tick(), this.startDelay)
  }

  _tick() {
    const currentStr = this.strings[this.strIndex]

    if (this.isDeleting) {
      this.charIndex--
    } else {
      this.charIndex++
    }

    this.el.textContent = currentStr.substring(0, this.charIndex)

    let nextDelay = this.isDeleting ? this.backSpeed : this.typeSpeed

    if (!this.isDeleting && this.charIndex === currentStr.length) {
      if (this.strIndex === this.strings.length - 1 && !this.loop) return
      nextDelay = this.backDelay
      this.isDeleting = true
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false
      this.strIndex = (this.strIndex + 1) % this.strings.length
      nextDelay = this.typeSpeed
    }

    this.timeout = setTimeout(() => this._tick(), nextDelay)
  }
}

function initNavDrawer() {
  const drawer = document.getElementById('nav-drawer')
  const toggle = document.getElementById('nav-toggle')
  const scrim = drawer?.querySelector('[data-drawer-close]')
  const navItems = drawer?.querySelectorAll('.m3-nav-item[data-scroll-to]')

  if (!drawer || !toggle) return

  function open() {
    drawer.hidden = false
    drawer.classList.remove('m3-nav-drawer--closing')
    document.body.style.overflow = 'hidden'
  }

  function close() {
    drawer.classList.add('m3-nav-drawer--closing')
    const onEnd = () => {
      drawer.hidden = true
      drawer.classList.remove('m3-nav-drawer--closing')
      document.body.style.overflow = ''
      drawer.removeEventListener('animationend', onEnd)
    }
    drawer.addEventListener('animationend', onEnd)
  }

  toggle.addEventListener('click', open)
  scrim?.addEventListener('click', close)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden && !drawer.classList.contains('m3-nav-drawer--closing')) {
      close()
    }
  })

  navItems?.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.scrollTo
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      close()
    })
  })
}

function initThemeToggle() {
  const toggles = document.querySelectorAll('#theme-toggle-top, #theme-toggle-drawer')
  if (toggles.length === 0) return

  const icons = document.querySelectorAll('#theme-toggle-top .material-symbols-outlined, #theme-toggle-drawer .material-symbols-outlined')

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    const isDark = theme === 'dark'
    icons.forEach(icon => {
      icon.textContent = isDark ? 'light_mode' : 'dark_mode'
    })

    const drawerLabel = document.querySelector('#theme-toggle-drawer .m3-nav-item__label')
    if (drawerLabel) {
      drawerLabel.textContent = isDark ? '亮色模式' : '深色模式'
    }
    localStorage.setItem('theme', theme)
  }

  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = saved || (prefersDark ? 'dark' : 'light')
  applyTheme(theme)

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme')
      applyTheme(current === 'dark' ? 'light' : 'dark')
    })
  })
}

const presetColors = [
  '#6750a4',
  '#386a20',
  '#006399',
  '#9a2c27',
  '#8d5000',
  '#00696d',
  '#904e84',
  '#625b71',
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
}

function mixRgb([r1, g1, b1], [r2, g2, b2], t) {
  return [
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ]
}

function generateTonalPalette(seedHex) {
  const [sr, sg, sb] = hexToRgb(seedHex)
  const [h, seedSat, seedLight] = rgbToHsl(sr, sg, sb)

  const toneToLight = {
    0: 0, 10: 8, 20: 18, 30: 29,
    40: 40, 50: 51, 60: 62,
    70: 73, 80: 84, 90: 91,
    95: 96, 99: 99, 100: 100,
  }

  const toneToSatMul = {
    0: 1.0, 10: 1.0, 20: 0.95, 30: 0.92,
    40: 1.0, 50: 1.0, 60: 1.0,
    70: 0.85, 80: 0.65, 90: 0.45,
    95: 0.25, 99: 0.08, 100: 0,
  }

  const refSat = Math.min(1, Math.max(0.2, seedSat))

  const palette = {}
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]

  for (const tone of tones) {
    const l = toneToLight[tone] / 100
    const sat = Math.min(1, refSat * toneToSatMul[tone])
    const rgb = hslToRgb(h, sat, l)
    palette[tone] = rgbToHex(...rgb)
  }

  palette[0] = '#000000'
  palette[100] = '#ffffff'
  return palette
}

function isLightColor(hex) {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    case b: h = ((r - g) / d + 4) / 6; break
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  if (s === 0) return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ]
}

function applyPrimaryColor(hex) {
  const primary = generateTonalPalette(hex)

  const [ph, ps, pl] = rgbToHsl(...hexToRgb(hex))
  const secRgb = hslToRgb(ph, Math.max(0, ps - 0.22), pl)
  const secondary = generateTonalPalette(rgbToHex(...secRgb))

  const terRgb = hslToRgb((ph + 0.125) % 1, Math.max(0.15, ps - 0.1), pl)
  const tertiary = generateTonalPalette(rgbToHex(...terRgb))

  const errRgb = hslToRgb(0.02, 0.75, 0.35)
  const error = generateTonalPalette(rgbToHex(...errRgb))

  const tint = (ratio) => rgbToHex(...mixRgb(hexToRgb(hex), [255, 255, 255], ratio))
  const surfaceLowest = tint(0.955)
  const surfaceLow    = tint(0.935)
  const surfaceMid    = tint(0.925)
  const surfaceHigh   = tint(0.915)
  const surfaceHighest = tint(0.905)

  const palettes = { primary, secondary, tertiary, error }

  const sysLight = (name, pal) => `
      --md-sys-color-${name}: ${pal[40]};
      --md-sys-color-on-${name}: ${isLightColor(pal[40]) ? pal[10] : '#ffffff'};
      --md-sys-color-${name}-container: ${pal[90]};
      --md-sys-color-on-${name}-container: ${pal[10]};`

  const sysDark = (name, pal) => `
      --md-sys-color-${name}: ${pal[80]};
      --md-sys-color-on-${name}: ${pal[20]};
      --md-sys-color-${name}-container: ${pal[30]};
      --md-sys-color-on-${name}-container: ${pal[90]};`

  const refVars = (name, pal) =>
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
      .map(t => `--md-ref-palette-${name}${t}: ${pal[t]};`).join('\n      ')

  let styleEl = document.getElementById('m3-dynamic-colors')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'm3-dynamic-colors'
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = `
    
    :root {
      ${refVars('primary', primary)}
      ${refVars('secondary', secondary)}
      ${refVars('tertiary', tertiary)}
      ${refVars('error', error)}

      ${sysLight('primary', primary)}
      ${sysLight('secondary', secondary)}
      ${sysLight('tertiary', tertiary)}
      ${sysLight('error', error)}
      
      --md-sys-color-surface-container-lowest: ${surfaceLowest};
      --md-sys-color-surface-container-low: ${surfaceLow};
      --md-sys-color-surface-container: ${surfaceMid};
      --md-sys-color-surface-container-high: ${surfaceHigh};
      --md-sys-color-surface-container-highest: ${surfaceHighest};
    }
    
    [data-theme="dark"] {
      ${sysDark('primary', primary)}
      ${sysDark('secondary', secondary)}
      ${sysDark('tertiary', tertiary)}
      ${sysDark('error', error)}
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        ${sysDark('primary', primary)}
        ${sysDark('secondary', secondary)}
        ${sysDark('tertiary', tertiary)}
        ${sysDark('error', error)}
      }
    }
  `

  document.querySelectorAll('.m3-color-swatch').forEach(sw => {
    sw.classList.toggle('m3-color-swatch--active', sw.dataset.color === hex)
  })

  localStorage.setItem('primaryColor', hex)
}

function initColorSwatches() {
  const container = document.getElementById('color-swatches')
  if (!container) return

  const savedColor = localStorage.getItem('primaryColor') || presetColors[0]

  container.innerHTML = presetColors.map(hex => `
    <button class="m3-color-swatch ${hex === savedColor ? 'm3-color-swatch--active' : ''}"
            data-color="${hex}"
            style="background: ${hex}"
            aria-label="主题色 ${hex}"
            title="${hex}"></button>
  `).join('')

  container.addEventListener('click', (e) => {
    const swatch = e.target.closest('.m3-color-swatch')
    if (!swatch) return
    applyPrimaryColor(swatch.dataset.color)
  })

  applyPrimaryColor(savedColor)
}

const skillsByCategory = {
  '前端': [
    { name: 'HTML', percent: 68 },
    { name: 'JavaScript', percent: 76 },
    { name: 'TypeScript', percent: 9 },
  ],
  '后端': [
    { name: 'Node.js', percent: 72 },
    { name: 'Java', percent: 85 },
    { name: 'Kotlin', percent: 94 },
    { name: 'Rust', percent: 92 },
    { name: '易语言', percent: 99 },
    { name: 'vibe coding', percent: 10000 },
  ],
  '工具': [
    { name: 'Git', percent: 60 },
    { name: 'Docker', percent: 1 },
    { name: 'Qwen Code', percent: 100 },
    { name: 'Codex', percent: 100 },
    { name: 'Claude Code', percent: 100},
  ],
}

const allSkills = Object.entries(skillsByCategory).flatMap(([cat, items]) =>
  items.map(s => ({ ...s, category: cat }))
)

const projects = [
  {
    icon: '🥒',
    title: 'zw-rs',
    desc: '记录自慰次数的 Telegram 机器人',
    tags: ['Rust', 'Telegram', 'Open Source'],
    link: 'https://github.com/VeryBaaad/zw-rs',
  },
  {
    icon: '⛰️',
    title: 'meta-magic_mount-rs',
    desc: '轻量的 KernelSU 元模块',
    tags: ['Rust', 'KernelSU', 'Android'],
    link: 'https://github.com/Tools-cx-app/meta-magic_mount-rs',
  },
  {
    icon: '🧩',
    title: 'BaaadHooker',
    desc: 'Xposed 模块，适用于多种应用的Hook',
    tags: ['Java', 'Kotlin', 'Xposed'],
    link: 'https://github.com/Xposed-Modules-Repo/cat.baaad.hooker',
  },
  {
    icon: '💣',
    title: 'RandFill',
    desc: '使用随机数据破坏文件',
    tags: ['Rust', 'CLI', 'Open Source'],
    link: 'https://github.com/OpenHelloMiddle/RandFill',
  },
  {
    icon: '🤖',
    title: 'BaaadAI',
    desc: '一只在Telegram和你对话的猫娘',
    tags: ['JavaScript', 'Telegram'],
    link: 'https://t.me/BaaadAI_bot',
  },
  {
    icon: '🖱️',
    title: 'mmover',
    desc: '鼠标移动CLI工具',
    tags: ['Rust', 'CLI', 'Open Source'],
    link: 'https://github.com/OpenHelloMiddle/mmover',
  },
]

function renderSkills(filter = '全部') {
  const container = document.getElementById('skills-container')
  if (!container) return

  const filtered = filter === '全部'
    ? allSkills
    : allSkills.filter(s => s.category === filter)

  container.innerHTML = filtered.map(skill => `
    <div class="m3-progress-item">
      <div class="m3-progress-item__header">
        <span class="m3-progress-item__label">${skill.name}</span>
        <span class="m3-progress-item__value">${skill.percent}%</span>
      </div>
      <div class="m3-linear-progress" role="progressbar" aria-valuenow="${skill.percent}" aria-valuemin="0" aria-valuemax="100">
        <div class="m3-linear-progress__track">
          <div class="m3-linear-progress__indicator" data-scale="${skill.percent / 100}">
            <div class="m3-linear-progress__stop"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('')

  const indicators = [...container.querySelectorAll('.m3-linear-progress__indicator')]
  let animated = false

  function startAnimation() {
    if (animated) return
    animated = true

    const startTime = performance.now()
    const duration = 800
    const stagger = 80

    function easeOutBack(t) {

      const c1 = 1.2
      return 1 + c1 * Math.pow(t - 1, 3) + (c1 - 1) * Math.pow(t - 1, 2)
    }

    function frame(now) {
      const elapsed = now - startTime

      indicators.forEach((ind, i) => {
        const barStart = i * stagger
        const barElapsed = elapsed - barStart
        if (barElapsed < 0) return

        const raw = Math.min(barElapsed / duration, 1)
        const eased = easeOutBack(raw)
        ind.style.transform = `scaleX(${eased * parseFloat(ind.dataset.scale)})`
      })

      const lastStart = (indicators.length - 1) * stagger
      if (elapsed < lastStart + duration) {
        requestAnimationFrame(frame)
      }
    }

    requestAnimationFrame(frame)
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAnimation()
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  observer.observe(container)
}

function initSkillChips() {
  const chipsRow = document.getElementById('skill-chips')
  if (!chipsRow) return

  const categories = ['全部', ...Object.keys(skillsByCategory)]

  chipsRow.innerHTML = categories.map(cat => `
    <span class="m3-chip m3-chip--filter ${cat === '全部' ? 'm3-chip--selected' : ''}" data-filter="${cat}">
      ${cat === '全部' ? '' : '<span class="material-symbols-outlined m3-chip__check">check</span>'}
      <span class="m3-chip__label">${cat}</span>
    </span>
  `).join('')

  chipsRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.m3-chip--filter')
    if (!chip) return

    chipsRow.querySelectorAll('.m3-chip--filter').forEach(c => c.classList.remove('m3-chip--selected'))
    chip.classList.add('m3-chip--selected')

    const filter = chip.dataset.filter
    renderSkills(filter)
  })
}

function renderProjects() {
  const container = document.getElementById('projects-container')
  if (!container) return

  container.innerHTML = projects.map(project => `
    <a href="${project.link}" class="m3-project-card" target="_blank" rel="noopener">
      <div class="m3-project-card__content">
        <div class="m3-project-card__header">
          <span class="m3-project-card__icon">${project.icon}</span>
          <span class="m3-project-card__title">${project.title}</span>
        </div>
        <p class="m3-project-card__desc">${project.desc}</p>
        <div class="m3-project-card__tags">
          ${project.tags.map(tag => `<span class="m3-project-card__tag">${tag}</span>`).join('')}
        </div>
      </div>
    </a>
  `).join('')
}

function initFAB() {
  const fab = document.getElementById('fab-top')
  if (!fab) return

  let ticking = false

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          fab.classList.add('m3-fab--visible')
        } else {
          fab.classList.remove('m3-fab--visible')
        }
        ticking = false
      })
      ticking = true
    }
  })

  fab.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function initTopAppBarScroll() {
  const bar = document.querySelector('.m3-top-app-bar')
  if (!bar) return

  let ticking = false

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 4) {
          bar.classList.add('m3-top-app-bar--scrolled')
        } else {
          bar.classList.remove('m3-top-app-bar--scrolled')
        }
        ticking = false
      })
      ticking = true
    }
  })
}

function updateFooterYear() {
  const el = document.getElementById('footer-year')
  if (el) el.textContent = new Date().getFullYear()
}

function init() {

  const taglineEl = document.getElementById('typed-tagline')
  if (taglineEl) {
    new TypingEffect(taglineEl, [
      'baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad',
      '我王小兆要上一档',
      '装b我让你飞起来',
      '仔细想想 对吗...?',
    ], {
      typeSpeed: 80,
      backSpeed: 40,
      backDelay: 2500,
      loop: true,
    }).start()
  }

  renderSkills()
  renderProjects()

  initRipples()
  initNavDrawer()
  initThemeToggle()
  initColorSwatches()
  initSkillChips()
  initFAB()
  initTopAppBarScroll()
  updateFooterYear()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
