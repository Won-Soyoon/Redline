/**
 * RedLine - 지정헌혈 매칭 플랫폼 클라이언트 사이드 시뮬레이션 로직
 */

// 1. Initial State Data (시뮬레이션 초기 데이터)
let requests = [
  {
    id: 1,
    patientName: '김수철',
    registryNumber: '540612-1482931',
    hospital: '서울대학교병원',
    bloodType: 'A',
    rhFactor: '+',
    targetDonors: 3,
    currentDonors: 1,
    urgency: 'high',
    x: 320, // 서울대병원
    y: 120,
    regDate: '2026-06-20 09:15'
  },
  {
    id: 2,
    patientName: '이영희',
    registryNumber: '620514-2098234',
    hospital: '삼성서울병원',
    bloodType: 'O',
    rhFactor: '+',
    targetDonors: 3,
    currentDonors: 1,
    urgency: 'medium',
    x: 710, // 삼성서울병원
    y: 480,
    regDate: '2026-06-20 11:30'
  },
  {
    id: 3,
    patientName: '박민재',
    registryNumber: '921104-1029483',
    hospital: '세브란스병원',
    bloodType: 'B',
    rhFactor: '-',
    targetDonors: 2,
    currentDonors: 0,
    urgency: 'high',
    x: 180, // 세브란스병원
    y: 240,
    regDate: '2026-06-20 14:02'
  },
  {
    id: 4,
    patientName: '최선우',
    registryNumber: '750302-2938472',
    hospital: '서울아산병원',
    bloodType: 'AB',
    rhFactor: '+',
    targetDonors: 4,
    currentDonors: 2,
    urgency: 'low',
    x: 850, // 서울아산병원
    y: 360,
    regDate: '2026-06-20 15:45'
  },
  {
    id: 5,
    patientName: '정아름',
    registryNumber: '880922-2039481',
    hospital: '가톨릭대 서울성모병원',
    bloodType: 'O',
    rhFactor: '-',
    targetDonors: 2,
    currentDonors: 0,
    urgency: 'high',
    x: 500, // 성모병원
    y: 460,
    regDate: '2026-06-20 17:10'
  }
];

// Hospital Coordinate Mapping table (병원별 기준 좌표)
const hospitalCoordinates = {
  '서울대학교병원': { x: 320, y: 120 },
  '세브란스병원': { x: 180, y: 240 },
  '삼성서울병원': { x: 710, y: 480 },
  '서울아산병원': { x: 850, y: 360 },
  '가톨릭대 서울성모병원': { x: 500, y: 460 },
  '고려대학교 안암병원': { x: 580, y: 100 }
};

// Global App States
let currentFilter = 'all';
let selectedRequestId = null;
let activeDonatedRequestId = null; // User's active donation choice
let todayDonorsCount = 24;

// 2. DOM Elements Cache
const DOM = {
  markersContainer: document.getElementById('map-markers-container'),
  emptyMapMsg: document.getElementById('map-empty-msg'),
  detailCard: document.getElementById('detail-card'),
  closeDetailBtn: document.getElementById('close-detail-btn'),
  
  // Detail card elements
  detailUrgency: document.getElementById('detail-urgency'),
  detailBlood: document.getElementById('detail-blood'),
  detailHospital: document.getElementById('detail-hospital'),
  detailPatient: document.getElementById('detail-patient'),
  detailReg: document.getElementById('detail-reg'),
  detailProgressRatio: document.getElementById('detail-progress-ratio'),
  detailProgressBar: document.getElementById('detail-progress-bar'),
  btnDonateSubmit: document.getElementById('btn-donate-submit'),
  
  // Form elements
  requestForm: document.getElementById('donation-request-form'),
  
  // Header count
  headerActiveCount: document.getElementById('header-active-count'),
  headerTodayDonors: document.getElementById('header-today-donors'),
  
  // Filters
  filterButtons: document.querySelectorAll('.btn-filter'),
  
  // Dashboard / Active Tracker
  trackerEmptyState: document.getElementById('tracker-empty-state'),
  trackerActiveContent: document.getElementById('tracker-active-content'),
  trackerHospital: document.getElementById('tracker-hospital'),
  trackerBlood: document.getElementById('tracker-blood'),
  trackerPatient: document.getElementById('tracker-patient'),
  trackerReg: document.getElementById('tracker-reg'),
  trackerCountMatched: document.getElementById('tracker-count-matched'),
  trackerCountNeeded: document.getElementById('tracker-count-needed'),
  trackerMatchingPct: document.getElementById('tracker-matching-pct'),
  trackerProgressBar: document.getElementById('tracker-progress-bar'),
  
  // Receipt elements
  receiptWidget: document.getElementById('receipt-widget'),
  receiptPlaceholder: document.getElementById('receipt-placeholder-text'),
  receiptRealContent: document.getElementById('receipt-real-content'),
  receiptSerialNo: document.getElementById('receipt-serial-no'),
  receiptHospitalVal: document.getElementById('receipt-hospital-val'),
  receiptPatientVal: document.getElementById('receipt-patient-val'),
  receiptRegVal: document.getElementById('receipt-reg-val'),
  receiptBloodVal: document.getElementById('receipt-blood-val'),
  receiptDateVal: document.getElementById('receipt-date-val'),
  receiptBarcodeNum: document.getElementById('receipt-barcode-num'),
  btnCopyReferral: document.getElementById('btn-copy-referral'),
  btnPrintReferral: document.getElementById('btn-print-referral'),
  receiptActionsPanel: document.getElementById('receipt-actions-panel'),
  
  // Toast container
  toastContainer: document.getElementById('toast-container')
};

// 3. Core Functions & Event Handlers

// Initialize Application
function init() {
  lucide.createIcons();
  renderMarkers();
  updateHeaderCounts();
  setupEventListeners();
}

// Update Active Counts in Header
function updateHeaderCounts() {
  const activeCount = requests.filter(r => r.currentDonors < r.targetDonors).length;
  DOM.headerActiveCount.textContent = activeCount;
  DOM.headerTodayDonors.textContent = todayDonorsCount;
}

// setup Event Listeners
function setupEventListeners() {
  // Form Submission
  DOM.requestForm.addEventListener('submit', handleFormSubmit);
  
  // Close Detail Card
  DOM.closeDetailBtn.addEventListener('click', closeDetailCard);
  
  // Donation Submit Action
  DOM.btnDonateSubmit.addEventListener('click', handleDonationSubmit);
  
  // Filters Event Delegation
  DOM.filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      DOM.filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderMarkers();
      closeDetailCard();
    });
  });

  // Receipt Actions
  DOM.btnCopyReferral.addEventListener('click', copyReferralInfo);
  DOM.btnPrintReferral.addEventListener('click', printReferralSheet);
}

// Render Request Pins on Map Viewport
function renderMarkers() {
  DOM.markersContainer.innerHTML = '';
  
  // Filter based on selected blood type
  const filteredRequests = requests.filter(req => {
    if (currentFilter === 'all') return true;
    return req.bloodType === currentFilter;
  });
  
  // Toggle empty state message
  if (filteredRequests.length === 0) {
    DOM.emptyMapMsg.style.display = 'flex';
  } else {
    DOM.emptyMapMsg.style.display = 'none';
  }
  
  filteredRequests.forEach(req => {
    const marker = document.createElement('div');
    marker.className = `map-marker urgency-${req.urgency}`;
    if (selectedRequestId === req.id) {
      marker.classList.add('active');
    }
    
    // Convert coordinate maps relative to percentage width/height (1000 x 600 viewbox)
    const posX = (req.x / 10);
    const posY = (req.y / 6);
    
    marker.style.left = `${posX}%`;
    marker.style.top = `${posY}%`;
    
    marker.innerHTML = `
      <div class="marker-pulse-ring"></div>
      <div class="marker-pin">
        <span class="marker-text">${req.bloodType}${req.rhFactor}</span>
      </div>
    `;
    
    // Hover details using custom DOM title or floating indicator (simple title logic for fallback)
    marker.title = `[${req.urgency.toUpperCase()}] ${req.hospital} - ${req.patientName} (${req.bloodType}${req.rhFactor}형)`;
    
    // Click Handler
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      selectRequest(req.id);
    });
    
    DOM.markersContainer.appendChild(marker);
  });
}

// Select Specific Blood Request
function selectRequest(id) {
  selectedRequestId = id;
  
  // Toggle active styling on markers
  const markers = DOM.markersContainer.querySelectorAll('.map-marker');
  const filteredRequests = requests.filter(req => {
    if (currentFilter === 'all') return true;
    return req.bloodType === currentFilter;
  });
  
  // Re-render markers to update active styling easily
  renderMarkers();
  
  const req = requests.find(r => r.id === id);
  if (!req) return;
  
  // Populate Detail Card
  DOM.detailUrgency.textContent = req.urgency === 'high' ? '최긴급' : req.urgency === 'medium' ? '긴급' : '보통';
  DOM.detailUrgency.className = `detail-badge ${req.urgency}`;
  DOM.detailBlood.textContent = `${req.bloodType}${req.rhFactor}`;
  DOM.detailHospital.textContent = req.hospital;
  DOM.detailPatient.textContent = req.patientName;
  
  // Mask registry number for simulation safety
  const maskedReg = maskRegistryNumber(req.registryNumber);
  DOM.detailReg.textContent = maskedReg;
  
  // Progress ratios
  DOM.detailProgressRatio.textContent = `${req.currentDonors}명 참여 완료 / ${req.targetDonors}명 필요`;
  const pct = Math.min((req.currentDonors / req.targetDonors) * 100, 100);
  DOM.detailProgressBar.style.width = `${pct}%`;
  
  // Update donation button state
  if (activeDonatedRequestId === req.id) {
    DOM.btnDonateSubmit.disabled = true;
    DOM.btnDonateSubmit.innerHTML = `<i data-lucide="check-circle-2"></i><span>이미 참여 완료된 요청입니다</span>`;
  } else if (req.currentDonors >= req.targetDonors) {
    DOM.btnDonateSubmit.disabled = true;
    DOM.btnDonateSubmit.innerHTML = `<i data-lucide="check-circle"></i><span>매칭 완료된 긴급 요청</span>`;
  } else {
    DOM.btnDonateSubmit.disabled = false;
    DOM.btnDonateSubmit.innerHTML = `<i data-lucide="heart-handshake"></i><span>이 환자에게 헌혈하러 가기</span>`;
  }
  
  lucide.createIcons();
  
  // Open Detail Card Panel
  DOM.detailCard.classList.add('open');
}

// Close Detail Card
function closeDetailCard() {
  DOM.detailCard.classList.remove('open');
  selectedRequestId = null;
  
  // Clear active styling on map pins
  const activePins = DOM.markersContainer.querySelectorAll('.map-marker.active');
  activePins.forEach(p => p.classList.remove('active'));
}

// Masking Utility
function maskRegistryNumber(regStr) {
  // Pattern: 260620-1345678 -> 260620-1******
  const parts = regStr.split('-');
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1].charAt(0)}******`;
  }
  return regStr;
}

// Handle caregiver request registration form
function handleFormSubmit(e) {
  e.preventDefault();
  
  const pName = document.getElementById('patient-name').value.trim();
  const regNo = document.getElementById('registry-number').value.trim();
  const hospital = document.getElementById('hospital-select').value;
  const bloodType = document.getElementById('blood-type').value;
  const rh = document.getElementById('rh-factor').value;
  const target = parseInt(document.getElementById('target-donors').value, 10);
  const urgency = document.querySelector('input[name="urgency"]:checked').value;
  
  // Fetch default coordinate of the selected hospital
  const baseCoord = hospitalCoordinates[hospital] || { x: 500, y: 300 };
  
  // Add slight random offset to prevent exact marker overlapping
  const offsetRange = 30; // pixels
  const finalX = baseCoord.x + (Math.random() * offsetRange * 2 - offsetRange);
  const finalY = baseCoord.y + (Math.random() * offsetRange * 2 - offsetRange);
  
  // Create new request
  const newReq = {
    id: Date.now(),
    patientName: pName,
    registryNumber: regNo,
    hospital: hospital,
    bloodType: bloodType,
    rhFactor: rh,
    targetDonors: target,
    currentDonors: 0,
    urgency: urgency,
    x: Math.max(50, Math.min(950, finalX)),
    y: Math.max(50, Math.min(550, finalY)),
    regDate: getFormattedCurrentTime()
  };
  
  // Prepend to requests list
  requests.unshift(newReq);
  
  // Update UI and map markers
  currentFilter = 'all'; // Reset filter to show the new marker
  DOM.filterButtons.forEach(btn => {
    if (btn.getAttribute('data-filter') === 'all') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  renderMarkers();
  updateHeaderCounts();
  
  // Focus and open details for the newly created request
  selectRequest(newReq.id);
  
  // Trigger simulation Toast notification
  showToast(
    '긴급 지정헌혈 요청 등록', 
    `환자 [${pName}]님의 헌혈 매칭 요청이 실시간 등록되어 주변에 전파되었습니다.`,
    'red'
  );
  
  // Reset Form inputs
  DOM.requestForm.reset();
  // Keep the checked default state
  document.querySelector('input[name="urgency"][value="medium"]').checked = true;
}

// User participates in a designated blood donation
function handleDonationSubmit() {
  if (!selectedRequestId) return;
  
  const reqIndex = requests.findIndex(r => r.id === selectedRequestId);
  if (reqIndex === -1) return;
  
  const req = requests[reqIndex];
  
  // Lock request ID as active donation
  activeDonatedRequestId = req.id;
  
  // Simulation: increment matched donor count
  req.currentDonors += 1;
  todayDonorsCount += 1;
  
  // Refresh UI Components
  renderMarkers();
  updateHeaderCounts();
  
  // Refresh detail card
  selectRequest(req.id);
  
  // 1. Update Match Dashboard Tracker
  updateDashboardTracker(req);
  
  // 2. Generate Yellow referral receipt
  generateReferralReceipt(req);
  
  // Toast Alert
  showToast(
    '지정헌혈 동참 참여 완료',
    `[${req.hospital}] ${req.patientName} 환자님 매칭에 참여하셨습니다. 모바일 의뢰서가 발급되었습니다.`,
    'green'
  );
}

// Update Match Dashboard Tracker Area
function updateDashboardTracker(req) {
  DOM.trackerEmptyState.classList.add('hidden');
  DOM.trackerActiveContent.classList.remove('hidden');
  
  DOM.trackerHospital.textContent = req.hospital;
  DOM.trackerBlood.textContent = `${req.bloodType}${req.rhFactor}형`;
  DOM.trackerPatient.textContent = req.patientName;
  DOM.trackerReg.textContent = maskRegistryNumber(req.registryNumber);
  
  // Counts
  DOM.trackerCountMatched.textContent = req.currentDonors;
  const needed = Math.max(0, req.targetDonors - req.currentDonors);
  DOM.trackerCountNeeded.textContent = needed === 0 ? '완료' : `${needed}명`;
  
  // Percentage and Bar
  const pct = Math.round(Math.min((req.currentDonors / req.targetDonors) * 100, 100));
  DOM.trackerMatchingPct.textContent = `${pct}%`;
  DOM.trackerProgressBar.style.width = `${pct}%`;
}

// Generate Receipt Mobile Referral
function generateReferralReceipt(req) {
  // Update status styling from unissued border to receipt paper container
  DOM.receiptWidget.classList.remove('receipt-unissued');
  DOM.receiptPlaceholder.classList.add('hidden');
  DOM.receiptRealContent.classList.remove('hidden');
  DOM.receiptActionsPanel.classList.remove('hidden');
  
  // Serial number generation (e.g. RL-20260620-X)
  const todayStr = getFormattedCurrentTime().substring(0, 10).replace(/-/g, '');
  const serialNo = `RL-${todayStr}-${100 + (req.id % 900)}`;
  DOM.receiptSerialNo.textContent = serialNo;
  
  // Fields
  DOM.receiptHospitalVal.textContent = req.hospital;
  DOM.receiptPatientVal.textContent = req.patientName;
  DOM.receiptRegVal.textContent = req.registryNumber; // Full registry is shown in receipt for verification at center
  DOM.receiptBloodVal.textContent = `${req.rhFactor}${req.bloodType}형 (${req.rhFactor === '+' ? 'Rh플러스' : 'Rh마이너스'})`;
  DOM.receiptDateVal.textContent = getFormattedCurrentTime();
  
  // Barcode numbers
  DOM.receiptBarcodeNum.textContent = `*${serialNo}-DONOR*`;
}

// Clipboard Copy action
function copyReferralInfo() {
  if (!activeDonatedRequestId) return;
  const req = requests.find(r => r.id === activeDonatedRequestId);
  if (!req) return;
  
  const textToCopy = `
[RedLine 모바일 지정헌혈 의뢰서]
■ 수혈 의료기관: ${req.hospital}
■ 환자명(수혜자): ${req.patientName}
■ 환자 등록번호: ${req.registryNumber}
■ 필요 혈액형: ${req.rhFactor}${req.bloodType}형
■ 수혈용 의뢰제제: 적혈구제제(RBC) / 성분채혈혈소판(Platelet)
* 헌혈의 집 방문 시 이 메시지를 보여주세요.
  `.trim();
  
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      showToast('클립보드 복사 성공', '의뢰서 정보가 클립보드에 복사되었습니다. 카카오톡 등으로 공유할 수 있습니다.', 'blue');
    })
    .catch(err => {
      showToast('클립보드 복사 실패', '복사 권한이 없습니다. 직접 드래그하여 복사해 주세요.', 'yellow');
    });
}

// Print action simulation
function printReferralSheet() {
  window.print();
}

// Custom Toast System
function showToast(title, message, type = 'red') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'alert-circle';
  if (type === 'green') iconName = 'check-circle';
  if (type === 'blue') iconName = 'info';
  if (type === 'yellow') iconName = 'help-circle';
  
  toast.innerHTML = `
    <div class="toast-icon-wrapper">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
  
  DOM.toastContainer.appendChild(toast);
  lucide.createIcons(); // Instantly resolve dynamic icon
  
  // Slide out after 3.5s and remove at 4s
  setTimeout(() => {
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.5s ease';
  }, 3500);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Helper Time formatter (Returns YYYY-MM-DD HH:MM format)
function getFormattedCurrentTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Trigger initialization on content load
window.addEventListener('DOMContentLoaded', init);
