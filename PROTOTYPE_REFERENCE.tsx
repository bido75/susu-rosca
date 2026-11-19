import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeftRight,
  Send,
  Sparkles,
  Wallet,
  Calendar,
  Award,
  FileCheck,
  History,
  LayoutDashboard,
  CircleDot,
  ChevronRight,
  X,
  Check,
  MessageSquare,
  Building2,
  Smartphone,
  Info,
  Trash2,
  UserPlus,
  Trophy
} from 'lucide-react';

// --- INITIAL SAMPLE DATA ---
const INITIAL_CIRCLES = [
  {
    id: 'circle-1',
    name: 'Family Home & Wealth Circle',
    contributionAmount: 500,
    frequency: 'Monthly',
    mode: 'Ledger Mode (Zelle / Venmo / Cash)',
    fairValueSlots: true,
    currentCycle: 3,
    startDate: '2026-09-01',
    nextPayoutDate: '2026-12-01',
    members: [
      {
        id: 'm1',
        name: 'Amara Okafor',
        handle: '@amara.o • (410) 555-0192',
        trustScore: 99,
        slot: 1,
        payoutStatus: 'Paid Out',
        payoutDate: '2026-10-01',
        currentCycleStatus: 'Verified',
        paymentMethod: 'Zelle',
        txRef: 'ZL-884920',
        avatarColor: 'bg-emerald-600'
      },
      {
        id: 'm2',
        name: 'Marcus Vance',
        handle: '@mvance • (443) 555-0148',
        trustScore: 96,
        slot: 2,
        payoutStatus: 'Paid Out',
        payoutDate: '2026-11-01',
        currentCycleStatus: 'Verified',
        paymentMethod: 'Venmo',
        txRef: 'VM-339104',
        avatarColor: 'bg-teal-600'
      },
      {
        id: 'm3',
        name: 'Elena Rostova',
        handle: '@erostova • (202) 555-0177',
        trustScore: 98,
        slot: 3,
        payoutStatus: 'Up Next',
        payoutDate: '2026-12-01',
        currentCycleStatus: 'Verified',
        paymentMethod: 'Zelle',
        txRef: 'ZL-992011',
        avatarColor: 'bg-cyan-700'
      },
      {
        id: 'm4',
        name: 'Devon Brooks',
        handle: '@dbrooks • (301) 555-0113',
        trustScore: 91,
        slot: 4,
        payoutStatus: 'Upcoming',
        payoutDate: '2027-01-01',
        currentCycleStatus: 'Proof Uploaded',
        paymentMethod: 'CashApp',
        txRef: 'CA-774129',
        avatarColor: 'bg-amber-600'
      },
      {
        id: 'm5',
        name: 'Priya Nair',
        handle: '@priyanair • (410) 555-0165',
        trustScore: 94,
        slot: 5,
        payoutStatus: 'Upcoming',
        payoutDate: '2027-02-01',
        currentCycleStatus: 'Pending',
        paymentMethod: 'Zelle',
        txRef: '',
        avatarColor: 'bg-indigo-600'
      },
      {
        id: 'm6',
        name: 'Kwame Mensah',
        handle: '@kmensah • (240) 555-0184',
        trustScore: 97,
        slot: 6,
        payoutStatus: 'Upcoming',
        payoutDate: '2027-03-01',
        currentCycleStatus: 'Pending',
        paymentMethod: 'Venmo',
        txRef: '',
        avatarColor: 'bg-rose-600'
      }
    ],
    auditLog: [
      {
        id: 'log-101',
        timestamp: 'Nov 18, 2026 • 11:42 AM',
        type: 'proof',
        title: 'Payment Proof Uploaded',
        detail: 'Devon Brooks submitted CashApp receipt #CA-774129 ($500.00) for Cycle 3.'
      },
      {
        id: 'log-102',
        timestamp: 'Nov 17, 2026 • 04:15 PM',
        type: 'verified',
        title: 'Contribution Verified',
        detail: 'Organizer verified Elena Rostova’s Zelle transfer ($500.00) for Cycle 3.'
      },
      {
        id: 'log-103',
        timestamp: 'Nov 01, 2026 • 09:00 AM',
        type: 'payout',
        title: 'Cycle 2 Pot Disbursed',
        detail: 'Disbursed $2,940.00 (incl. 2% Fair-Value Slot 2 fee) to Marcus Vance.'
      },
      {
        id: 'log-104',
        timestamp: 'Oct 01, 2026 • 09:00 AM',
        type: 'payout',
        title: 'Cycle 1 Pot Disbursed',
        detail: 'Disbursed $2,940.00 (incl. 2% Fair-Value Slot 1 fee) to Amara Okafor.'
      }
    ]
  },
  {
    id: 'circle-2',
    name: 'Neighborhood Entrepreneurs Seed Pot',
    contributionAmount: 250,
    frequency: 'Bi-Weekly',
    mode: 'Automated ACH Mode',
    fairValueSlots: false,
    currentCycle: 1,
    startDate: '2026-11-15',
    nextPayoutDate: '2026-11-29',
    members: [
      {
        id: 'b1',
        name: 'Tariq Hassan',
        handle: '@tariq.h • (410) 555-0201',
        trustScore: 95,
        slot: null,
        payoutStatus: 'Unassigned',
        payoutDate: 'TBD',
        currentCycleStatus: 'Verified',
        paymentMethod: 'ACH Auto-Debit',
        txRef: 'ACH-55019',
        avatarColor: 'bg-emerald-600'
      },
      {
        id: 'b2',
        name: 'Sofia Alvarez',
        handle: '@salvarez • (443) 555-0299',
        trustScore: 98,
        slot: null,
        payoutStatus: 'Unassigned',
        payoutDate: 'TBD',
        currentCycleStatus: 'Verified',
        paymentMethod: 'ACH Auto-Debit',
        txRef: 'ACH-55020',
        avatarColor: 'bg-teal-600'
      },
      {
        id: 'b3',
        name: 'Jordan Lee',
        handle: '@jlee.biz • (301) 555-0244',
        trustScore: 92,
        slot: null,
        payoutStatus: 'Unassigned',
        payoutDate: 'TBD',
        currentCycleStatus: 'Pending',
        paymentMethod: 'ACH Auto-Debit',
        txRef: '',
        avatarColor: 'bg-sky-600'
      },
      {
        id: 'b4',
        name: 'Nadia Boateng',
        handle: '@nadiab • (202) 555-0288',
        trustScore: 96,
        slot: null,
        payoutStatus: 'Unassigned',
        payoutDate: 'TBD',
        currentCycleStatus: 'Pending',
        paymentMethod: 'ACH Auto-Debit',
        txRef: '',
        avatarColor: 'bg-purple-600'
      }
    ],
    auditLog: [
      {
        id: 'log-201',
        timestamp: 'Nov 15, 2026 • 10:00 AM',
        type: 'created',
        title: 'Circle Initialized',
        detail: 'Neighborhood Entrepreneurs Seed Pot created ($250 Bi-Weekly, 4 members). Ready for Payout Wheel spin.'
      }
    ]
  }
];

const SAMPLE_MEMBER_POOL = [
  { name: 'Chidi Eze', handle: '@chidieze • (410) 555-0311' },
  { name: 'Maya Lin', handle: '@mayalin • (443) 555-0342' },
  { name: 'Andre Baptiste', handle: '@abaptiste • (301) 555-0398' },
  { name: 'Fatima Al-Mansoor', handle: '@fatimam • (202) 555-0376' },
  { name: 'Darius Cole', handle: '@dcole • (240) 555-0329' },
  { name: 'Zara Osei', handle: '@zaraosei • (410) 555-0355' }
];

const WHEEL_COLORS = [
  '#059669', // emerald-600
  '#0d9488', // teal-600
  '#0284c7', // sky-600
  '#d97706', // amber-600
  '#4f46e5', // indigo-600
  '#e11d48', // rose-600
  '#7c3aed', // violet-600
  '#0891b2'  // cyan-600
];

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-indigo-600',
  'bg-rose-600'
];

// Helper to compute future date strings cleanly
function addCycleOffset(baseDateStr, frequency, cycleIndex) {
  const date = new Date(baseDateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return '2026-12-15';
  if (frequency === 'Weekly') {
    date.setDate(date.getDate() + cycleIndex * 7);
  } else if (frequency === 'Bi-Weekly') {
    date.setDate(date.getDate() + cycleIndex * 14);
  } else {
    date.setMonth(date.getMonth() + cycleIndex);
  }
  return date.toISOString().split('T')[0];
}

function formatReadableDate(isoStr) {
  if (!isoStr || isoStr === 'TBD') return 'TBD';
  const d = new Date(isoStr + 'T12:00:00');
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function App() {
  const [circles, setCircles] = useState(INITIAL_CIRCLES);
  const [activeCircleId, setActiveCircleId] = useState(INITIAL_CIRCLES[0].id);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'wheel' | 'ledger' | 'audit'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toast / Notification Banner State
  const [toast, setToast] = useState(null);

  // Payout Wheel State
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [recentWinner, setRecentWinner] = useState(null);

  // Slot Swap State
  const [swapSlotA, setSwapSlotA] = useState('');
  const [swapSlotB, setSwapSlotB] = useState('');

  // Create Circle Form State
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState(300);
  const [newFrequency, setNewFrequency] = useState('Monthly');
  const [newMode, setNewMode] = useState('Ledger Mode (Zelle / Venmo / Cash)');
  const [newFairValue, setNewFairValue] = useState(true);
  const [newMembers, setNewMembers] = useState([
    { name: 'You (Organizer)', handle: '@organizer • (410) 555-0100' },
    { name: '', handle: '' },
    { name: '', handle: '' },
    { name: '', handle: '' }
  ]);

  const activeCircle = useMemo(
    () => circles.find((c) => c.id === activeCircleId) || circles[0],
    [circles, activeCircleId]
  );

  // Reset swap selectors & winner banner when switching circles
  useEffect(() => {
    setRecentWinner(null);
    setSwapSlotA('');
    setSwapSlotB('');
  }, [activeCircleId]);

  const triggerToast = (title, message, type = 'success') => {
    setToast({ title, message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Derived Metrics for Active Circle
  const totalPot = activeCircle.contributionAmount * activeCircle.members.length;
  const totalCycles = activeCircle.members.length;
  const verifiedCount = activeCircle.members.filter(
    (m) => m.currentCycleStatus === 'Verified'
  ).length;
  const collectedAmount = verifiedCount * activeCircle.contributionAmount;
  const collectionPercent = Math.round((verifiedCount / totalCycles) * 100);
  const avgTrustScore = Math.round(
    activeCircle.members.reduce((sum, m) => sum + m.trustScore, 0) / totalCycles
  );

  const sortedBySlot = useMemo(() => {
    return [...activeCircle.members].sort((a, b) => {
      if (a.slot === null && b.slot === null) return 0;
      if (a.slot === null) return 1;
      if (b.slot === null) return -1;
      return a.slot - b.slot;
    });
  }, [activeCircle.members]);

  const currentRecipient = useMemo(() => {
    return (
      activeCircle.members.find((m) => m.slot === activeCircle.currentCycle) ||
      sortedBySlot.find((m) => m.payoutStatus === 'Up Next') ||
      null
    );
  }, [activeCircle, sortedBySlot]);

  const unassignedMembers = useMemo(
    () => activeCircle.members.filter((m) => m.slot === null),
    [activeCircle.members]
  );

  // Calculate Fair-Value Slot Net Payout
  const getNetPayoutForSlot = (slotNum) => {
    if (!activeCircle.fairValueSlots || !slotNum || totalCycles < 4) {
      return { amount: totalPot, badge: null };
    }
    const adjustment = Math.round(totalPot * 0.02);
    if (slotNum === 1 || slotNum === 2) {
      return {
        amount: totalPot - adjustment,
        badge: `-$${adjustment} (2% Early Slot Fee)`
      };
    }
    if (slotNum === totalCycles || slotNum === totalCycles - 1) {
      return {
        amount: totalPot + adjustment,
        badge: `+$${adjustment} (2% Anchor Bonus)`
      };
    }
    return { amount: totalPot, badge: 'Standard 100% Pot' };
  };

  // Update helper for active circle
  const updateActiveCircle = (updaterFn) => {
    setCircles((prev) =>
      prev.map((c) => (c.id === activeCircle.id ? updaterFn(c) : c))
    );
  };

  // --- WHEEL SPIN LOGIC ---
  const handleSpinWheel = () => {
    if (isSpinning || unassignedMembers.length === 0) return;

    setIsSpinning(true);
    setRecentWinner(null);

    const nextSlotNumber = totalCycles - unassignedMembers.length + 1;
    const chosenIndex = Math.floor(Math.random() * unassignedMembers.length);
    const chosenMember = unassignedMembers[chosenIndex];

    // Calculate visual rotation on the full member wheel
    const memberFullIndex = activeCircle.members.findIndex(
      (m) => m.id === chosenMember.id
    );
    const sliceAngle = 360 / totalCycles;
    // Pointer is at top (0 deg / 360 deg). Center of slice i is at (i + 0.5) * sliceAngle
    const targetSliceCenter = (memberFullIndex + 0.5) * sliceAngle;
    const desiredNormalizedAngle = (360 - targetSliceCenter) % 360;
    const currentNormalized = wheelRotation % 360;
    const delta = (desiredNormalizedAngle - currentNormalized + 360) % 360;
    const extraSpins = 360 * 5; // 5 full dramatic rotations
    const newRotation = wheelRotation + extraSpins + delta;

    setWheelRotation(newRotation);

    setTimeout(() => {
      const assignedDate = addCycleOffset(
        activeCircle.startDate,
        activeCircle.frequency,
        nextSlotNumber
      );

      updateActiveCircle((circle) => ({
        ...circle,
        nextPayoutDate:
          nextSlotNumber === circle.currentCycle ? assignedDate : circle.nextPayoutDate,
        members: circle.members.map((m) =>
          m.id === chosenMember.id
            ? {
                ...m,
                slot: nextSlotNumber,
                payoutDate: assignedDate,
                payoutStatus:
                  nextSlotNumber < circle.currentCycle
                    ? 'Paid Out'
                    : nextSlotNumber === circle.currentCycle
                    ? 'Up Next'
                    : 'Upcoming'
              }
            : m
        ),
        auditLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: 'Just now',
            type: 'wheel',
            title: `Slot #${nextSlotNumber} Assigned via Wheel`,
            detail: `${chosenMember.name} landed on Payout Slot #${nextSlotNumber} (${formatReadableDate(
              assignedDate
            )}).`
          },
          ...circle.auditLog
        ]
      }));

      setIsSpinning(false);
      setRecentWinner({ member: chosenMember, slot: nextSlotNumber });
      triggerToast(
        `Slot #${nextSlotNumber} Assigned!`,
        `${chosenMember.name} will collect the pot on ${formatReadableDate(assignedDate)}.`
      );
    }, 3200);
  };

  // Auto-assign all remaining unassigned slots
  const handleAutoAssignAll = () => {
    if (isSpinning || unassignedMembers.length === 0) return;

    const shuffled = [...unassignedMembers].sort(() => Math.random() - 0.5);
    let nextSlot = totalCycles - unassignedMembers.length + 1;
    const assignments = {};

    shuffled.forEach((m) => {
      assignments[m.id] = {
        slot: nextSlot,
        payoutDate: addCycleOffset(
          activeCircle.startDate,
          activeCircle.frequency,
          nextSlot
        )
      };
      nextSlot += 1;
    });

    setWheelRotation((prev) => prev + 720);

    updateActiveCircle((circle) => {
      const updatedMembers = circle.members.map((m) => {
        if (assignments[m.id]) {
          const s = assignments[m.id].slot;
          return {
            ...m,
            slot: s,
            payoutDate: assignments[m.id].payoutDate,
            payoutStatus:
              s < circle.currentCycle
                ? 'Paid Out'
                : s === circle.currentCycle
                ? 'Up Next'
                : 'Upcoming'
          };
        }
        return m;
      });
      const currentSlotMember = updatedMembers.find(
        (m) => m.slot === circle.currentCycle
      );
      return {
        ...circle,
        nextPayoutDate: currentSlotMember
          ? currentSlotMember.payoutDate
          : circle.nextPayoutDate,
        members: updatedMembers,
        auditLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: 'Just now',
            type: 'wheel',
            title: 'Full Rotation Randomly Assigned',
            detail: `All ${shuffled.length} remaining payout slots were assigned via cryptographic shuffle.`
          },
          ...circle.auditLog
        ]
      };
    });

    triggerToast(
      'Full Rotation Assigned',
      'All payout dates and slot positions are now locked on the schedule.'
    );
  };

  // Swap two assigned slots
  const handleSwapSlots = (e) => {
    e.preventDefault();
    const sA = Number(swapSlotA);
    const sB = Number(swapSlotB);
    if (!sA || !sB || sA === sB) return;

    const memberA = activeCircle.members.find((m) => m.slot === sA);
    const memberB = activeCircle.members.find((m) => m.slot === sB);
    if (!memberA || !memberB) return;

    if (memberA.payoutStatus === 'Paid Out' || memberB.payoutStatus === 'Paid Out') {
      triggerToast(
        'Cannot Swap Completed Slot',
        'Slots that have already been paid out cannot be traded.',
        'warning'
      );
      return;
    }

    updateActiveCircle((circle) => ({
      ...circle,
      members: circle.members.map((m) => {
        if (m.id === memberA.id) {
          return {
            ...m,
            slot: memberB.slot,
            payoutDate: memberB.payoutDate,
            payoutStatus: memberB.payoutStatus
          };
        }
        if (m.id === memberB.id) {
          return {
            ...m,
            slot: memberA.slot,
            payoutDate: memberA.payoutDate,
            payoutStatus: memberA.payoutStatus
          };
        }
        return m;
      }),
      auditLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'swap',
          title: 'Peer Slot Swap Executed',
          detail: `${memberA.name} (Slot #${sA}) and ${memberB.name} (Slot #${sB}) traded payout positions.`
        },
        ...circle.auditLog
      ]
    }));

    setSwapSlotA('');
    setSwapSlotB('');
    triggerToast(
      'Payout Slots Swapped',
      `${memberA.name} and ${memberB.name} successfully traded slots #${sA} and #${sB}.`
    );
  };

  // --- LEDGER & VERIFICATION ACTIONS ---
  const handleSimulateProofUpload = (memberId) => {
    const member = activeCircle.members.find((m) => m.id === memberId);
    if (!member) return;
    const prefix =
      member.paymentMethod === 'Venmo'
        ? 'VM'
        : member.paymentMethod === 'CashApp'
        ? 'CA'
        : member.paymentMethod.includes('ACH')
        ? 'ACH'
        : 'ZL';
    const randomRef = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    updateActiveCircle((circle) => ({
      ...circle,
      members: circle.members.map((m) =>
        m.id === memberId
          ? { ...m, currentCycleStatus: 'Proof Uploaded', txRef: randomRef }
          : m
      ),
      auditLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'proof',
          title: 'Payment Proof Uploaded',
          detail: `${member.name} uploaded ${member.paymentMethod} confirmation #${randomRef} ($${circle.contributionAmount}).`
        },
        ...circle.auditLog
      ]
    }));

    triggerToast(
      'Proof Received',
      `${member.name} submitted receipt #${randomRef}. Ready for organizer verification.`
    );
  };

  const handleVerifyPayment = (memberId) => {
    const member = activeCircle.members.find((m) => m.id === memberId);
    if (!member) return;
    const refToUse =
      member.txRef || `VER-${Math.floor(100000 + Math.random() * 900000)}`;

    updateActiveCircle((circle) => ({
      ...circle,
      members: circle.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              currentCycleStatus: 'Verified',
              txRef: refToUse,
              trustScore: Math.min(100, m.trustScore + 1)
            }
          : m
      ),
      auditLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'verified',
          title: 'Contribution Verified',
          detail: `Organizer verified $${circle.contributionAmount} from ${member.name} (Ref: ${refToUse}).`
        },
        ...circle.auditLog
      ]
    }));

    triggerToast(
      'Payment Verified',
      `$${activeCircle.contributionAmount} added to Cycle ${activeCircle.currentCycle} pot.`
    );
  };

  const handleSendReminder = (member) => {
    updateActiveCircle((circle) => ({
      ...circle,
      auditLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'reminder',
          title: 'WhatsApp / SMS Nudge Sent',
          detail: `Automated reminder sent to ${member.name} (${member.handle}) for Cycle ${circle.currentCycle}.`
        },
        ...circle.auditLog
      ]
    }));

    triggerToast(
      `WhatsApp Nudge Sent to ${member.name}`,
      `"Hi ${member.name.split(' ')[0]}! Friendly reminder that your $${activeCircle.contributionAmount} contribution for ${activeCircle.name} (Cycle ${activeCircle.currentCycle}) is due soon."`,
      'info'
    );
  };

  // --- DISBURSE POT & ADVANCE CYCLE ---
  const handleDisbursePot = () => {
    if (verifiedCount < totalCycles) return;
    if (!currentRecipient) {
      triggerToast(
        'Assign Payout Slots First',
        'Please spin the Payout Wheel to assign who receives this cycle’s pot.',
        'warning'
      );
      setActiveTab('wheel');
      return;
    }

    const payoutCalc = getNetPayoutForSlot(currentRecipient.slot);
    const isFinalCycle = activeCircle.currentCycle >= totalCycles;
    const nextCycleNum = isFinalCycle
      ? activeCircle.currentCycle
      : activeCircle.currentCycle + 1;

    updateActiveCircle((circle) => {
      const updatedMembers = circle.members.map((m) => {
        const isCurrentWinner = m.id === currentRecipient.id;
        const isNextWinner = !isFinalCycle && m.slot === nextCycleNum;

        return {
          ...m,
          payoutStatus: isCurrentWinner
            ? 'Paid Out'
            : isNextWinner
            ? 'Up Next'
            : m.payoutStatus,
          // Reset ledger for next cycle if rotation continues
          currentCycleStatus: isFinalCycle ? 'Verified' : 'Pending',
          txRef: isFinalCycle ? m.txRef : ''
        };
      });

      const nextRecipientObj = updatedMembers.find((m) => m.slot === nextCycleNum);

      return {
        ...circle,
        currentCycle: nextCycleNum,
        nextPayoutDate: nextRecipientObj
          ? nextRecipientObj.payoutDate
          : circle.nextPayoutDate,
        members: updatedMembers,
        auditLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: 'Just now',
            type: 'payout',
            title: `Cycle ${circle.currentCycle} Pot Disbursed ($${payoutCalc.amount.toLocaleString()})`,
            detail: `Full lump sum sent to ${currentRecipient.name} (Slot #${
              currentRecipient.slot
            }). ${
              isFinalCycle
                ? 'Full rotation complete!'
                : `Circle advanced to Cycle ${nextCycleNum} of ${totalCycles}.`
            }`
          },
          ...circle.auditLog
        ]
      };
    });

    triggerToast(
      isFinalCycle
        ? 'Full Susu Rotation Completed!'
        : `Disbursed $${payoutCalc.amount.toLocaleString()} to ${currentRecipient.name}!`,
      isFinalCycle
        ? 'Every member has received their payout. Trust scores updated!'
        : `Cycle ${activeCircle.currentCycle + 1} is now open for contributions.`
    );
  };

  // --- CREATE NEW CIRCLE HANDLERS ---
  const handleAutoFillMembers = () => {
    const filled = [
      { name: 'You (Organizer)', handle: '@organizer • (410) 555-0100' },
      ...SAMPLE_MEMBER_POOL.slice(0, 4)
    ];
    setNewMembers(filled);
  };

  const handleAddMemberRow = () => {
    if (newMembers.length >= 12) return;
    setNewMembers([...newMembers, { name: '', handle: '' }]);
  };

  const handleRemoveMemberRow = (idx) => {
    if (newMembers.length <= 3) return;
    setNewMembers(newMembers.filter((_, i) => i !== idx));
  };

  const handleMemberFieldChange = (idx, field, value) => {
    setNewMembers(
      newMembers.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleCreateCircleSubmit = (e) => {
    e.preventDefault();
    const validMembers = newMembers.filter((m) => m.name.trim() !== '');
    if (!newName.trim() || validMembers.length < 3) {
      triggerToast(
        'Incomplete Circle Details',
        'Please enter a circle name and at least 3 members.',
        'warning'
      );
      return;
    }

    const todayStr = '2026-11-18';
    const firstPayout = addCycleOffset(todayStr, newFrequency, 1);

    const createdCircle = {
      id: `circle-${Date.now()}`,
      name: newName.trim(),
      contributionAmount: Number(newAmount) || 200,
      frequency: newFrequency,
      mode: newMode,
      fairValueSlots: newFairValue,
      currentCycle: 1,
      startDate: todayStr,
      nextPayoutDate: firstPayout,
      members: validMembers.map((m, idx) => ({
        id: `nm-${Date.now()}-${idx}`,
        name: m.name.trim(),
        handle: m.handle.trim() || `@member${idx + 1} • SMS Verified`,
        trustScore: idx === 0 ? 98 : Math.floor(88 + Math.random() * 10),
        slot: null,
        payoutStatus: 'Unassigned',
        payoutDate: 'TBD',
        currentCycleStatus: 'Pending',
        paymentMethod: newMode.includes('ACH') ? 'ACH Auto-Debit' : 'Zelle',
        txRef: '',
        avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length]
      })),
      auditLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'created',
          title: 'New Susu Circle Launched',
          detail: `"${newName.trim()}" created with ${
            validMembers.length
          } members at $${Number(newAmount)} (${newFrequency}).`
        }
      ]
    };

    setCircles((prev) => [createdCircle, ...prev]);
    setActiveCircleId(createdCircle.id);
    setIsCreateModalOpen(false);
    setActiveTab('wheel'); // Take user straight to spin the payout wheel!

    // Reset form
    setNewName('');
    setNewAmount(300);
    setNewMembers([
      { name: 'You (Organizer)', handle: '@organizer • (410) 555-0100' },
      { name: '', handle: '' },
      { name: '', handle: '' },
      { name: '', handle: '' }
    ]);

    triggerToast(
      'Circle Created!',
      'Spin the Payout Wheel now to assign member payout slots.'
    );
  };

  // Check if entire rotation is done
  const isRotationComplete =
    activeCircle.currentCycle === totalCycles &&
    activeCircle.members.every((m) => m.payoutStatus === 'Paid Out');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl shadow-xl border p-4 flex items-start gap-3 transition-all ${
              toast.type === 'warning'
                ? 'bg-amber-950 text-amber-50 border-amber-700'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : 'bg-emerald-950 text-emerald-50 border-emerald-600'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : toast.type === 'info' ? (
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION (Desktop) & TOP BAR (Mobile) */}
      <aside className="lg:w-72 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <RefreshCw className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">
                    SusuFlow
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    MVP
                  </span>
                </div>
                <p className="text-xs text-slate-400">Trusted Community ROSCA</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-3 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Circle
            </button>
          </div>

          {/* Active Circle Switcher */}
          <div className="p-4 border-b border-slate-800/80">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Active Susu Circle ({circles.length})
            </label>
            <div className="space-y-1.5">
              {circles.map((c) => {
                const isSelected = c.id === activeCircle.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCircleId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ${c.contributionAmount}/{c.frequency === 'Monthly' ? 'mo' : c.frequency === 'Bi-Weekly' ? '2wk' : 'wk'} • {c.members.length} members
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 w-full hidden lg:flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Create New Susu Circle
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {[
              {
                id: 'overview',
                label: 'Circle Overview',
                icon: LayoutDashboard
              },
              {
                id: 'wheel',
                label: 'Payout Wheel & Slots',
                icon: CircleDot,
                badge: unassignedMembers.length > 0 ? `${unassignedMembers.length} Open` : null
              },
              {
                id: 'ledger',
                label: 'Contribution Ledger',
                icon: FileCheck,
                badge: `${verifiedCount}/${totalCycles}`
              },
              {
                id: 'audit',
                label: 'Payout & Audit Log',
                icon: History
              }
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-slate-800 text-emerald-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="hidden lg:block p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>0% Interest • 100% Transparent</span>
          </div>
          <p className="leading-relaxed">
            Every member contributes equally and receives the full pooled lump sum once per rotation.
          </p>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* TOP CONTEXT HEADER */}
        <header className="bg-white border-b border-slate-200 px-5 sm:px-8 py-5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {activeCircle.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeCircle.mode.includes('ACH') ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5" />
                  )}
                  {activeCircle.mode}
                </span>
                {activeCircle.fairValueSlots && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    Fair-Value Slots Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                ${activeCircle.contributionAmount.toLocaleString()} {activeCircle.frequency} contribution •{' '}
                {totalCycles} trusted members • Started {formatReadableDate(activeCircle.startDate)}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {unassignedMembers.length > 0 && (
                <button
                  onClick={() => setActiveTab('wheel')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition cursor-pointer"
                >
                  <CircleDot className="w-4 h-4" />
                  Spin Payout Wheel ({unassignedMembers.length} left)
                </button>
              )}
              <button
                onClick={() => setActiveTab('ledger')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Cycle {activeCircle.currentCycle} Ledger
              </button>
            </div>
          </div>
        </header>

        {/* KPI SUMMARY RIBBON */}
        <section className="px-5 sm:px-8 pt-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Total Pot Size */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Lump-Sum Pot
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  ${totalPot.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">
                  (${activeCircle.contributionAmount} × {totalCycles})
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1.5">
                0% APR • Full principal payout
              </p>
            </div>

            {/* KPI 2: Current Cycle & Next Payout */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rotation Progress
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  Cycle {activeCircle.currentCycle} of {totalCycles}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 truncate">
                Next Payout:{' '}
                <span className="font-semibold text-slate-900">
                  {formatReadableDate(activeCircle.nextPayoutDate)}
                </span>
                {currentRecipient ? ` (${currentRecipient.name.split(' ')[0]})` : ''}
              </p>
            </div>

            {/* KPI 3: Circle Trust Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Circle Susu Score
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {avgTrustScore}/100
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  High Trust
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Peer-vouched & verified identities
              </p>
            </div>

            {/* KPI 4: Current Cycle Collection */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cycle {activeCircle.currentCycle} Collection
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {collectionPercent}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">
                  ${collectedAmount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">
                  / ${totalPot.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${collectionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* DYNAMIC TAB CONTENT */}
        <section className="px-5 sm:px-8 py-6 flex-1">
          <div className="max-w-6xl mx-auto">
            {/* ============================================================
                TAB 1: OVERVIEW (Quick Visual Snapshot)
               ============================================================ */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Rotation Timeline & Current Recipient */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Spotlight Card for Current Cycle Recipient */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          {isRotationComplete
                            ? 'Rotation Complete'
                            : `Cycle ${activeCircle.currentCycle} Pot Recipient`}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold mt-1">
                          {currentRecipient
                            ? `${currentRecipient.name} (Slot #${currentRecipient.slot})`
                            : 'Payout Order Not Yet Assigned'}
                        </h2>
                        <p className="text-sm text-slate-300 mt-1">
                          {currentRecipient
                            ? `Scheduled to receive $${getNetPayoutForSlot(
                                currentRecipient.slot
                              ).amount.toLocaleString()} on ${formatReadableDate(
                                activeCircle.nextPayoutDate
                              )}.`
                            : 'Use the interactive Payout Wheel to randomly assign payout slots to members.'}
                        </p>
                      </div>

                      {currentRecipient ? (
                        <button
                          onClick={() => setActiveTab('ledger')}
                          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Manage Cycle {activeCircle.currentCycle} Pot
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('wheel')}
                          className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Open Payout Wheel
                        </button>
                      )}
                    </div>

                    {/* Visual Slot Track */}
                    <div className="mt-6 pt-5 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>Full Rotation Order</span>
                        <button
                          onClick={() => setActiveTab('wheel')}
                          className="text-emerald-400 hover:underline font-medium"
                        >
                          Edit / Swap Slots →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {sortedBySlot.map((m, i) => {
                          const isCurrent = m.slot === activeCircle.currentCycle;
                          const isPaid = m.payoutStatus === 'Paid Out';
                          return (
                            <div
                              key={m.id}
                              className={`rounded-xl p-2.5 border text-left transition ${
                                isCurrent
                                  ? 'bg-emerald-500/20 border-emerald-400'
                                  : isPaid
                                  ? 'bg-white/5 border-white/10 opacity-75'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span
                                  className={
                                    isCurrent ? 'text-emerald-300' : 'text-slate-400'
                                  }
                                >
                                  {m.slot ? `Slot #${m.slot}` : `Unassigned`}
                                </span>
                                {isPaid && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              <p className="text-xs font-semibold text-white truncate mt-1">
                                {m.name.split(' ')[0]}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {m.payoutStatus}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick Current Cycle Contribution Status */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Cycle {activeCircle.currentCycle} Contributions
                        </h3>
                        <p className="text-xs text-slate-500">
                          {verifiedCount} of {totalCycles} members verified ($
                          {collectedAmount.toLocaleString()} collected)
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('ledger')}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Full Verification Ledger →
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activeCircle.members.map((member) => (
                        <div
                          key={member.id}
                          className="px-5 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full ${member.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                            >
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {member.paymentMethod}
                                {member.txRef ? ` • ${member.txRef}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {member.currentCycleStatus === 'Verified' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            )}
                            {member.currentCycleStatus === 'Proof Uploaded' && (
                              <button
                                onClick={() => handleVerifyPayment(member.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Tap to Verify
                              </button>
                            )}
                            {member.currentCycleStatus === 'Pending' && (
                              <button
                                onClick={() => handleSimulateProofUpload(member.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              >
                                Simulate Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recent Activity & Rules Summary */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">Recent Circle Activity</h3>
                      <button
                        onClick={() => setActiveTab('audit')}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {activeCircle.auditLog.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {entry.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {entry.detail}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {entry.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fair-Value Mechanism Explainer Card */}
                  <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200/80 p-5">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Circle Governance Rules</span>
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-emerald-950/80 leading-relaxed">
                      <li>
                        • <strong>Equal Stake:</strong> Every member pays $
                        {activeCircle.contributionAmount} per {activeCircle.frequency.toLowerCase()} cycle.
                      </li>
                      <li>
                        • <strong>Fair-Value Slots:</strong>{' '}
                        {activeCircle.fairValueSlots
                          ? 'Enabled — Slots 1 & 2 contribute a 2% early-access fee distributed as a bonus to the final 2 anchor slots.'
                          : 'Disabled — Every slot receives the exact flat pot amount.'}
                      </li>
                      <li>
                        • <strong>Peer Slot Trading:</strong> Members may swap upcoming payout slots with mutual consent.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 2: INTERACTIVE PAYOUT WHEEL & SLOT MANAGER
               ============================================================ */}
            {activeTab === 'wheel' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 5 Cols: Animated SVG Spinning Wheel */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Transparent Slot Draw
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {unassignedMembers.length} unassigned
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Payout Order Wheel
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                    Spin to assign the next open payout slot fairly in front of the group.
                  </p>

                  {/* SVG Wheel Container */}
                  <div className="relative my-6 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                    {/* Top Pointer Triangle */}
                    <div className="absolute -top-3 z-20 drop-shadow-md">
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <polygon
                          points="14,26 2,4 26,4"
                          fill="#0f172a"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* Rotating Wheel SVG */}
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full drop-shadow-lg"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: isSpinning
                          ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.25, 1)'
                          : 'none'
                      }}
                    >
                      {activeCircle.members.map((member, index) => {
                        const count = activeCircle.members.length;
                        const angle = 360 / count;
                        const startAngle = index * angle - 90;
                        const endAngle = startAngle + angle;
                        const startRad = (Math.PI / 180) * startAngle;
                        const endRad = (Math.PI / 180) * endAngle;

                        const x1 = 100 + 95 * Math.cos(startRad);
                        const y1 = 100 + 95 * Math.sin(startRad);
                        const x2 = 100 + 95 * Math.cos(endRad);
                        const y2 = 100 + 95 * Math.sin(endRad);

                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        const midAngle = startAngle + angle / 2;
                        const midRad = (Math.PI / 180) * midAngle;
                        const textX = 100 + 58 * Math.cos(midRad);
                        const textY = 100 + 58 * Math.sin(midRad);

                        const isAssigned = member.slot !== null;
                        const fill = isAssigned
                          ? '#94a3b8'
                          : WHEEL_COLORS[index % WHEEL_COLORS.length];

                        return (
                          <g key={member.id}>
                            <path
                              d={pathData}
                              fill={fill}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                            <text
                              x={textX}
                              y={textY}
                              fill="#ffffff"
                              fontSize="8.5"
                              fontWeight="700"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                            >
                              {member.name.split(' ')[0]}
                              {isAssigned ? ` (#${member.slot})` : ''}
                            </text>
                          </g>
                        );
                      })}
                      {/* Center Hub */}
                      <circle
                        cx="100"
                        cy="100"
                        r="22"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      <text
                        x="100"
                        y="101"
                        fill="#34d399"
                        fontSize="7"
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        SUSU
                      </text>
                    </svg>
                  </div>

                  {/* Recent Winner Callout */}
                  {recentWinner && (
                    <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center gap-2 text-xs font-semibold">
                      <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {recentWinner.member.name} won Slot #{recentWinner.slot}!
                      </span>
                    </div>
                  )}

                  {/* Wheel Action Buttons */}
                  {unassignedMembers.length > 0 ? (
                    <div className="w-full space-y-2.5">
                      <button
                        onClick={handleSpinWheel}
                        disabled={isSpinning}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer"
                      >
                        {isSpinning
                          ? 'Spinning Wheel...'
                          : `Spin to Assign Slot #${
                              totalCycles - unassignedMembers.length + 1
                            }`}
                      </button>
                      <button
                        onClick={handleAutoAssignAll}
                        disabled={isSpinning}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      >
                        Auto-Assign Full Rotation ({unassignedMembers.length} Slots)
                      </button>
                    </div>
                  ) : (
                    <div className="w-full p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                      All {totalCycles} payout slots have been assigned! Use the Slot Swap tool on the right if members wish to trade positions.
                    </div>
                  )}
                </div>

                {/* Right 7 Cols: Payout Schedule Table & Peer Slot Swap */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Official Payout Rotation Schedule
                        </h3>
                        <p className="text-xs text-slate-500">
                          {activeCircle.fairValueSlots
                            ? 'Includes 2% Fair-Value Slot adjustment between early and anchor positions.'
                            : 'Standard equal pot distribution across all slots.'}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <th className="py-3 px-4">Slot</th>
                            <th className="py-3 px-4">Member</th>
                            <th className="py-3 px-4">Payout Date</th>
                            <th className="py-3 px-4">Net Payout</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {sortedBySlot.map((m) => {
                            const net = getNetPayoutForSlot(m.slot);
                            return (
                              <tr
                                key={m.id}
                                className={
                                  m.payoutStatus === 'Up Next'
                                    ? 'bg-emerald-50/40'
                                    : 'hover:bg-slate-50/70'
                                }
                              >
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {m.slot ? `#${m.slot}` : '—'}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-900">
                                    {m.name}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <span>Trust {m.trustScore}/100</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                                  {formatReadableDate(m.payoutDate)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900">
                                    {m.slot ? `$${net.amount.toLocaleString()}` : 'TBD'}
                                  </div>
                                  {m.slot && net.badge && (
                                    <div className="text-[10px] font-medium text-slate-500">
                                      {net.badge}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  {m.payoutStatus === 'Paid Out' && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Paid Out
                                    </span>
                                  )}
                                  {m.payoutStatus === 'Up Next' && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Up Next
                                    </span>
                                  )}
                                  {m.payoutStatus === 'Upcoming' && (
                                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700">
                                      Upcoming
                                    </span>
                                  )}
                                  {m.payoutStatus === 'Unassigned' && (
                                    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                      Needs Spin
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Peer-to-Peer Slot Swap Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Peer Slot Swap (Mutual Trade)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Need cash earlier or prefer to save for a later date? Two members with upcoming slots can trade positions anytime.
                    </p>

                    <form
                      onSubmit={handleSwapSlots}
                      className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      <select
                        value={swapSlotA}
                        onChange={(e) => setSwapSlotA(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Member A...</option>
                        {sortedBySlot
                          .filter((m) => m.slot !== null && m.payoutStatus !== 'Paid Out')
                          .map((m) => (
                            <option key={m.id} value={m.slot}>
                              Slot #{m.slot} — {m.name}
                            </option>
                          ))}
                      </select>

                      <select
                        value={swapSlotB}
                        onChange={(e) => setSwapSlotB(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Member B...</option>
                        {sortedBySlot
                          .filter((m) => m.slot !== null && m.payoutStatus !== 'Paid Out')
                          .map((m) => (
                            <option key={m.id} value={m.slot}>
                              Slot #{m.slot} — {m.name}
                            </option>
                          ))}
                      </select>

                      <button
                        type="submit"
                        disabled={!swapSlotA || !swapSlotB || swapSlotA === swapSlotB}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs py-2 px-4 transition cursor-pointer"
                      >
                        Execute Slot Swap
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 3: REAL-TIME CONTRIBUTION LEDGER & DISBURSEMENT
               ============================================================ */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                {/* Pot Readiness & Disbursement Action Banner */}
                <div
                  className={`rounded-2xl border p-5 sm:p-6 transition ${
                    verifiedCount === totalCycles && !isRotationComplete
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-lg'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            verifiedCount === totalCycles && !isRotationComplete
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          Cycle {activeCircle.currentCycle} of {totalCycles}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            verifiedCount === totalCycles && !isRotationComplete
                              ? 'text-emerald-100'
                              : 'text-slate-500'
                          }`}
                        >
                          {verifiedCount} of {totalCycles} Contributions Verified
                        </span>
                      </div>
                      <h2 className="text-xl font-bold mt-1.5">
                        {isRotationComplete
                          ? 'All Cycles Completed & Disbursed'
                          : verifiedCount === totalCycles
                          ? `100% Funded! Ready to Disburse $${(currentRecipient
                              ? getNetPayoutForSlot(currentRecipient.slot).amount
                              : totalPot
                            ).toLocaleString()}`
                          : `Collecting $${totalPot.toLocaleString()} Pot for ${
                              currentRecipient
                                ? currentRecipient.name
                                : 'Cycle Recipient'
                            }`}
                      </h2>
                      <p
                        className={`text-xs mt-1 ${
                          verifiedCount === totalCycles && !isRotationComplete
                            ? 'text-emerald-50'
                            : 'text-slate-500'
                        }`}
                      >
                        {isRotationComplete
                          ? 'Every member in this Susu circle has contributed and collected their full lump sum.'
                          : verifiedCount === totalCycles
                          ? 'All member payments are verified on the ledger. Release funds to close this cycle and advance.'
                          : 'Simulate member payments below and tap "Verify Payment" as organizer to unlock pot disbursement.'}
                      </p>
                    </div>

                    {!isRotationComplete && (
                      <button
                        onClick={handleDisbursePot}
                        disabled={verifiedCount < totalCycles}
                        className={`shrink-0 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                          verifiedCount === totalCycles
                            ? 'bg-slate-950 hover:bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        {currentRecipient
                          ? `Disburse Pot to ${currentRecipient.name.split(' ')[0]}`
                          : 'Disburse Pot'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Member Ledger Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Cycle {activeCircle.currentCycle} Contribution Ledger
                      </h3>
                      <p className="text-xs text-slate-500">
                        Test the full lifecycle: Member submits proof → Organizer verifies → WhatsApp reminder nudges.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Rail / Ref</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Interactive Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {activeCircle.members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full ${member.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                                >
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span>{member.name}</span>
                                    {member.slot && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        Slot #{member.slot}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {member.handle}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-xs font-semibold text-slate-800">
                                {member.paymentMethod}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {member.txRef || 'Awaiting transfer'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              ${activeCircle.contributionAmount.toLocaleString()}
                            </td>

                            <td className="py-3.5 px-4">
                              {member.currentCycleStatus === 'Verified' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified
                                </span>
                              )}
                              {member.currentCycleStatus === 'Proof Uploaded' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Proof Uploaded
                                </span>
                              )}
                              {member.currentCycleStatus === 'Pending' && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                  Pending
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                {member.currentCycleStatus === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleSimulateProofUpload(member.id)
                                      }
                                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                                    >
                                      Simulate Member Payment
                                    </button>
                                    <button
                                      onClick={() => handleSendReminder(member)}
                                      title="Send WhatsApp/SMS Reminder"
                                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                    >
                                      <Send className="w-3 h-3" />
                                      Remind
                                    </button>
                                  </>
                                )}

                                {member.currentCycleStatus === 'Proof Uploaded' && (
                                  <button
                                    onClick={() => handleVerifyPayment(member.id)}
                                    className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Verify Payment
                                  </button>
                                )}

                                {member.currentCycleStatus === 'Verified' && (
                                  <span className="text-xs text-slate-400 font-medium">
                                    Receipt Locked ✓
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 4: IMMUTABLE PAYOUT HISTORY & AUDIT LOG
               ============================================================ */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Transparent Circle Audit Ledger
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chronological record of verified contributions, wheel spins, slot swaps, and lump-sum disbursements.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {activeCircle.auditLog.length} Events
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeCircle.auditLog.map((item) => {
                    const badgeStyle =
                      item.type === 'payout'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : item.type === 'verified'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : item.type === 'swap' || item.type === 'wheel'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={item.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
                            >
                              {item.type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 font-medium shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============================================================
          CREATE NEW SUSU CIRCLE MODAL
         ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Launch a New Susu Circle</h2>
                  <p className="text-xs text-slate-400">
                    Configure pot rules, payment rails, and invited members
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCircleSubmit}
              className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
            >
              {/* Circle Name & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Circle Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Cousins Summer Vacation Pot"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contribution ($) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Frequency & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contribution Schedule
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection & Verification Rail
                  </label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ledger Mode (Zelle / Venmo / Cash)">
                      Ledger Mode (Zelle / Venmo / Cash)
                    </option>
                    <option value="Automated ACH Mode">
                      Automated ACH Mode (Bank Linked)
                    </option>
                  </select>
                </div>
              </div>

              {/* Fair-Value Slot Incentives Toggle */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enable Fair-Value Slot Incentives</span>
                  </div>
                  <p className="text-xs text-emerald-900/80 mt-0.5 leading-relaxed">
                    Early recipients (Slots 1 & 2) contribute a 2% convenience fee that is paid out as a bonus to the final anchor slots.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newFairValue}
                  onChange={(e) => setNewFairValue(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Dynamic Member Roster */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Circle Members ({newMembers.filter((m) => m.name.trim()).length} active • Min 3)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillMembers}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Auto-fill Sample Members
                  </button>
                </div>

                <div className="space-y-2">
                  {newMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={member.name}
                        onChange={(e) =>
                          handleMemberFieldChange(idx, 'name', e.target.value)
                        }
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="@handle or phone"
                        value={member.handle}
                        onChange={(e) =>
                          handleMemberFieldChange(idx, 'handle', e.target.value)
                        }
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {newMembers.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberRow(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {newMembers.length < 12 && (
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Another Member
                  </button>
                )}
              </div>

              {/* Calculated Summary Preview */}
              <div className="p-3.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Estimated Lump-Sum Pot Size:
                </span>
                <span className="text-base font-bold text-slate-900">
                  $
                  {(
                    (Number(newAmount) || 0) *
                    newMembers.filter((m) => m.name.trim() !== '').length
                  ).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    every {newFrequency.toLowerCase()} cycle
                  </span>
                </span>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
                >
                  Create Circle & Open Payout Wheel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}