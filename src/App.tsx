import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Kanban,
  ClipboardCheck,
  Truck,
  RefreshCw,
  BarChart3,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Printer,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Package,
  Calendar,
  AlertOctagon,
  Eye,
  FileSpreadsheet,
  X,
  Gauge
} from 'lucide-react';

// ==========================================
// TIPOS DE DATOS (MODELO LOGÍSTICO LITOGRÁFICO)
// ==========================================

export type ABCClass = 'A' | 'B' | 'C';
export type MaterialCategory = 'Papel y Cartón' | 'Tintas CMYK' | 'Planchas CTP' | 'Químicos y Barnices' | 'Acabados y MRO';
export type MachineTarget = 'Roland 700' | 'Komori';
export type DeliveryStatus = 'Solicitada' | 'En preparación' | 'En tránsito' | 'Entregada';
export type PriorityLevel = 'Normal' | 'Alta' | 'Urgente';

export interface InventoryItem {
  id: string;
  code: string;
  description: string;
  category: MaterialCategory;
  abcClass: ABCClass;
  currentStock: number;
  minStock: number;
  unit: string;
  location: string;
  compatibleMachines: MachineTarget[];
  notes?: string;
}

export interface MaterialOrder {
  id: string;
  opNumber: string;
  client: string;
  targetMachine: MachineTarget;
  requestedBy: string;
  authorizedBy: string;
  authorizedAt: string;
  priority: PriorityLevel;
  items: {
    itemId: string;
    itemCode: string;
    itemDescription: string;
    quantity: number;
    unit: string;
  }[];
  status: DeliveryStatus;
  transportMethod: 'Transpaleta hidráulica' | 'Montacargas eléctrico' | 'Carro multipropósito';
  scheduledTime: string;
  actualDeliveryTime?: string;
  leadTimeMinutes?: number;
  notes?: string;
  synchronized: boolean;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  orderId: string;
  opNumber: string;
  targetMachine: MachineTarget;
  itemCode: string;
  itemDescription: string;
  deductedQty: number;
  unit: string;
  previousStock: number;
  newStock: number;
  operator: string;
}

// ==========================================
// DATOS REALISTAS INICIALES (IMPRESOS EL DÍA)
// ==========================================

const INITIAL_INVENTORY: InventoryItem[] = [
  // Sustratos y Cartones (Clase A y B)
  {
    id: 'mat-a01',
    code: 'MAT-A01',
    description: 'Cartón Revestido Maule / Duplex Reverso Gris (70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'A',
    currentStock: 15000,
    minStock: 4000,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack A1',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Alta rotación para empaques plegadizos comerciales'
  },
  {
    id: 'mat-a02',
    code: 'MAT-A02',
    description: 'Papel Couché Brillo 90g (70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'A',
    currentStock: 20000,
    minStock: 5000,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack A2',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Sustrato estándar para afiches, insertos y catálogos'
  },
  {
    id: 'mat-a03',
    code: 'MAT-A03',
    description: 'Papel Bond / Offset 75g (70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'A',
    currentStock: 18000,
    minStock: 4500,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack A3',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Sustrato para papelería e informes'
  },
  {
    id: 'mat-a04',
    code: 'MAT-A04',
    description: 'Cartulina Folding / FBB Cal. 14 (300g, 70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'A',
    currentStock: 12500,
    minStock: 3000,
    unit: 'pliegos',
    location: 'Bodega Climatizada - Rack B1',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Insumo clave en estuchería farmacéutica y cosmética'
  },
  {
    id: 'mat-a05',
    code: 'MAT-A05',
    description: 'Papel Couché Brillo 150g (70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'A',
    currentStock: 3200, // Debajo de mínimo para alerta
    minStock: 3500,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack A4',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Alerta de stock: por debajo del umbral mínimo'
  },
  {
    id: 'mat-b01',
    code: 'MAT-B01',
    description: 'Cartulina Folding / FBB Calibre 16 (350g, 70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'B',
    currentStock: 8000,
    minStock: 2000,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack B2',
    compatibleMachines: ['Roland 700'],
    notes: 'Recomendado para estuches rígidos en Roland 700'
  },
  {
    id: 'mat-b02',
    code: 'MAT-B02',
    description: 'Cartón SBS (Sulfato Blanqueado Sólido) Cal. 14 (70×100 cm)',
    category: 'Papel y Cartón',
    abcClass: 'B',
    currentStock: 5200,
    minStock: 1500,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack B3',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'mat-b03',
    code: 'MAT-B03',
    description: 'Papel Autoadhesivo Couché (50×70 cm)',
    category: 'Papel y Cartón',
    abcClass: 'B',
    currentStock: 10000,
    minStock: 2500,
    unit: 'pliegos',
    location: 'Bodega Principal - Rack C1',
    compatibleMachines: ['Komori']
  },
  // Tintas Offset CMYK y Especiales
  {
    id: 'ink-a01',
    code: 'INK-A01',
    description: 'Tinta Offset CMYK Cyan Process',
    category: 'Tintas CMYK',
    abcClass: 'A',
    currentStock: 45,
    minStock: 15,
    unit: 'kg',
    location: 'Gabinete de Tintas - Posición C',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Trifecta estándar de cuatricromía'
  },
  {
    id: 'ink-a02',
    code: 'INK-A02',
    description: 'Tinta Offset CMYK Magenta Process',
    category: 'Tintas CMYK',
    abcClass: 'A',
    currentStock: 12, // Debajo de mínimo para alerta
    minStock: 15,
    unit: 'kg',
    location: 'Gabinete de Tintas - Posición M',
    compatibleMachines: ['Roland 700', 'Komori'],
    notes: 'Stock crítico: reposición solicitada a compras'
  },
  {
    id: 'ink-a03',
    code: 'INK-A03',
    description: 'Tinta Offset CMYK Yellow Process',
    category: 'Tintas CMYK',
    abcClass: 'A',
    currentStock: 50,
    minStock: 15,
    unit: 'kg',
    location: 'Gabinete de Tintas - Posición Y',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'ink-a04',
    code: 'INK-A04',
    description: 'Tinta Offset CMYK Black Process',
    category: 'Tintas CMYK',
    abcClass: 'A',
    currentStock: 65,
    minStock: 20,
    unit: 'kg',
    location: 'Gabinete de Tintas - Posición K',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'ink-c01',
    code: 'INK-C01',
    description: 'Tinta Low Migration (Baja Migración Grado Alimentario)',
    category: 'Tintas CMYK',
    abcClass: 'C',
    currentStock: 30,
    minStock: 10,
    unit: 'kg',
    location: 'Armario Especial Grado Sanitario',
    compatibleMachines: ['Roland 700']
  },
  {
    id: 'ink-c02',
    code: 'INK-C02',
    description: 'Tinta Offset Pantonera Directa (Fórmulas preparadas)',
    category: 'Tintas CMYK',
    abcClass: 'C',
    currentStock: 25,
    minStock: 8,
    unit: 'kg',
    location: 'Mesa de Pesaje y Mezcla de Tintas',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  // Planchas CTP Térmicas
  {
    id: 'ctp-a01',
    code: 'CTP-A01',
    description: 'Planchas CTP Térmicas 745×605 mm (Específica para Komori)',
    category: 'Planchas CTP',
    abcClass: 'A',
    currentStock: 35,
    minStock: 15,
    unit: 'unidades',
    location: 'Área CTP Preprensa - Anaquel 1',
    compatibleMachines: ['Komori'],
    notes: 'Exclusiva para prensa Komori media pliego'
  },
  {
    id: 'ctp-b01',
    code: 'CTP-B01',
    description: 'Planchas CTP Térmicas 1030×790 mm (Específica para Roland 700)',
    category: 'Planchas CTP',
    abcClass: 'B',
    currentStock: 7, // Debajo de mínimo
    minStock: 10,
    unit: 'unidades',
    location: 'Área CTP Preprensa - Anaquel 2',
    compatibleMachines: ['Roland 700'],
    notes: 'Stock crítico: exclusiva para Roland 700 gran formato'
  },
  // Químicos y Barnices
  {
    id: 'chm-b01',
    code: 'CHM-B01',
    description: 'Químico Revelador para Planchas CTP',
    category: 'Químicos y Barnices',
    abcClass: 'B',
    currentStock: 60,
    minStock: 20,
    unit: 'litros',
    location: 'Bodega de Químicos - Estante Q1',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'chm-b02',
    code: 'CHM-B02',
    description: 'Solución de Mojado (Fountain Solution ISO 12647)',
    category: 'Químicos y Barnices',
    abcClass: 'B',
    currentStock: 100,
    minStock: 30,
    unit: 'litros',
    location: 'Bodega de Químicos - Estante Q2',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'var-b01',
    code: 'VAR-B01',
    description: 'Barniz Acuoso Dispersión Base Agua (Brillante)',
    category: 'Químicos y Barnices',
    abcClass: 'B',
    currentStock: 120,
    minStock: 35,
    unit: 'kg',
    location: 'Zona de Barnices - Tambor B1',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'var-b02',
    code: 'VAR-B02',
    description: 'Barniz UV Total de Alto Brillo',
    category: 'Químicos y Barnices',
    abcClass: 'B',
    currentStock: 95,
    minStock: 25,
    unit: 'kg',
    location: 'Zona de Barnices - Tambor UV',
    compatibleMachines: ['Roland 700']
  },
  // MRO y Repuestos
  {
    id: 'mro-c01',
    code: 'MRO-C01',
    description: 'Mantillas de Caucho (Blankets) para Prensa Offset',
    category: 'Acabados y MRO',
    abcClass: 'C',
    currentStock: 8,
    minStock: 3,
    unit: 'unidades',
    location: 'Gabinete Repuestos MRO',
    compatibleMachines: ['Roland 700', 'Komori']
  },
  {
    id: 'adh-b01',
    code: 'ADH-B01',
    description: 'Adhesivo Vinílico PVA para Pegado de Cajas',
    category: 'Acabados y MRO',
    abcClass: 'B',
    currentStock: 85,
    minStock: 25,
    unit: 'kg',
    location: 'Bodega de Químicos - Tambor A3',
    compatibleMachines: ['Roland 700', 'Komori']
  }
];

const INITIAL_ORDERS: MaterialOrder[] = [
  {
    id: 'ord-101',
    opNumber: 'OP-2026-482',
    client: 'Laboratorios Farmacéuticos Vital',
    targetMachine: 'Roland 700',
    requestedBy: 'Operario Carlos Gómez (Prensista)',
    authorizedBy: 'Ing. Mariana Sinitave (Jefa Producción)',
    authorizedAt: '10:15 AM',
    priority: 'Alta',
    items: [
      {
        itemId: 'mat-a04',
        itemCode: 'MAT-A04',
        itemDescription: 'Cartulina Folding / FBB Cal. 14 (300g, 70×100 cm)',
        quantity: 2500,
        unit: 'pliegos'
      },
      {
        itemId: 'ink-a01',
        itemCode: 'INK-A01',
        itemDescription: 'Tinta Offset CMYK Cyan Process',
        quantity: 5,
        unit: 'kg'
      }
    ],
    status: 'En tránsito',
    transportMethod: 'Montacargas eléctrico',
    scheduledTime: '10:45 AM',
    notes: 'Kitting verificado conforme ISO 12647. Traslado por pasillo delimitado.',
    synchronized: false
  },
  {
    id: 'ord-102',
    opNumber: 'OP-2026-483',
    client: 'Editorial Andina S.A.',
    targetMachine: 'Komori',
    requestedBy: 'Operario Juan Camilo Mesa',
    authorizedBy: 'Ing. Mariana Sinitave (Jefa Producción)',
    authorizedAt: '10:30 AM',
    priority: 'Normal',
    items: [
      {
        itemId: 'mat-a02',
        itemCode: 'MAT-A02',
        itemDescription: 'Papel Couché Brillo 90g (70×100 cm)',
        quantity: 3000,
        unit: 'pliegos'
      },
      {
        itemId: 'ctp-a01',
        itemCode: 'CTP-A01',
        itemDescription: 'Planchas CTP Térmicas 745×605 mm (Komori)',
        quantity: 4,
        unit: 'unidades'
      }
    ],
    status: 'En preparación',
    transportMethod: 'Transpaleta hidráulica',
    scheduledTime: '11:15 AM',
    notes: 'Picking en proceso en Rack A2 y cuarto CTP.',
    synchronized: false
  },
  {
    id: 'ord-103',
    opNumber: 'OP-2026-484',
    client: 'Chocolates Corona & Cía',
    targetMachine: 'Roland 700',
    requestedBy: 'Operario Mateo Ramírez',
    authorizedBy: 'Miguel Palacio (Jefe de Planta)',
    authorizedAt: '10:40 AM',
    priority: 'Urgente',
    items: [
      {
        itemId: 'mat-a01',
        itemCode: 'MAT-A01',
        itemDescription: 'Cartón Revestido Maule / Duplex Reverso Gris',
        quantity: 4000,
        unit: 'pliegos'
      },
      {
        itemId: 'ink-c01',
        itemCode: 'INK-C01',
        itemDescription: 'Tinta Low Migration Grado Alimentario',
        quantity: 8,
        unit: 'kg'
      }
    ],
    status: 'Solicitada',
    transportMethod: 'Montacargas eléctrico',
    scheduledTime: '11:30 AM',
    notes: 'Tiraje urgente de empaque de exportación.',
    synchronized: false
  },
  {
    id: 'ord-100',
    opNumber: 'OP-2026-479',
    client: 'Distribuidora Gráfica Nacional',
    targetMachine: 'Komori',
    requestedBy: 'Operario Juan Camilo Mesa',
    authorizedBy: 'Miguel Palacio (Jefe de Planta)',
    authorizedAt: '08:15 AM',
    priority: 'Normal',
    items: [
      {
        itemId: 'mat-a03',
        itemCode: 'MAT-A03',
        itemDescription: 'Papel Bond / Offset 75g (70×100 cm)',
        quantity: 2000,
        unit: 'pliegos'
      },
      {
        itemId: 'ink-a04',
        itemCode: 'INK-A04',
        itemDescription: 'Tinta Offset CMYK Black Process',
        quantity: 6,
        unit: 'kg'
      }
    ],
    status: 'Entregada',
    transportMethod: 'Transpaleta hidráulica',
    scheduledTime: '08:45 AM',
    actualDeliveryTime: '08:52 AM',
    leadTimeMinutes: 17,
    notes: 'Recepción conforme en pie de máquina Komori. Descontado de inventario.',
    synchronized: true
  }
];

const INITIAL_SYNC_LOG: SyncLogEntry[] = [
  {
    id: 'sync-001',
    timestamp: '08:52:14 AM',
    orderId: 'ord-100',
    opNumber: 'OP-2026-479',
    targetMachine: 'Komori',
    itemCode: 'MAT-A03',
    itemDescription: 'Papel Bond / Offset 75g (70×100 cm)',
    deductedQty: 2000,
    unit: 'pliegos',
    previousStock: 20000,
    newStock: 18000,
    operator: 'Auxiliar Logístico Bodega'
  },
  {
    id: 'sync-002',
    timestamp: '08:52:14 AM',
    orderId: 'ord-100',
    opNumber: 'OP-2026-479',
    targetMachine: 'Komori',
    itemCode: 'INK-A04',
    itemDescription: 'Tinta Offset CMYK Black Process',
    deductedQty: 6,
    unit: 'kg',
    previousStock: 71,
    newStock: 65,
    operator: 'Auxiliar Logístico Bodega'
  }
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function App() {
  // Estado de navegación
  const [activeTab, setActiveTab] = useState<'kardex' | 'trazabilidad' | 'autorizaciones' | 'programacion' | 'sincronizacion' | 'desempeno'>('kardex');

  // Estados de datos sincronizados
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<MaterialOrder[]>(INITIAL_ORDERS);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(INITIAL_SYNC_LOG);

  // Estados de filtros y UI
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [abcFilter, setAbcFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'normal'>('all');
  const [machineFilter, setMachineFilter] = useState<'all' | MachineTarget>('all');

  // Feedback y Notificaciones
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Modales
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Recepción de Proveedor');

  // Formulario de Autorizaciones
  const [authOp, setAuthOp] = useState('OP-2026-485');
  const [authClient, setAuthClient] = useState('');
  const [authMachine, setAuthMachine] = useState<MachineTarget>('Roland 700');
  const [authRequester, setAuthRequester] = useState('Operario Carlos Gómez (Prensista)');
  const [authApprover, setAuthApprover] = useState('Ing. Mariana Sinitave (Jefa Producción)');
  const [authPriority, setAuthPriority] = useState<PriorityLevel>('Normal');
  const [authItemId, setAuthItemId] = useState('mat-a01');
  const [authItemQty, setAuthItemQty] = useState<number>(1000);
  const [authSecondItemId, setAuthSecondItemId] = useState('none');
  const [authSecondItemQty, setAuthSecondItemQty] = useState<number>(0);
  const [authTransport, setAuthTransport] = useState<'Transpaleta hidráulica' | 'Montacargas eléctrico' | 'Carro multipropósito'>('Montacargas eléctrico');
  const [authNotes, setAuthNotes] = useState('');

  // Formulario Programación de Entregas
  const [schedMachine, setSchedMachine] = useState<MachineTarget>('Roland 700');
  const [schedTime, setSchedTime] = useState('11:45 AM');
  const [schedDeliveryType, setSchedDeliveryType] = useState<'JIT' | 'Milk Run'>('JIT');

  // Alerta temporal helper
  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // ==========================================
  // FUNCIÓN CLAVE: SINCRONIZACIÓN Y DESCUENTO KARDEX
  // ==========================================
  const completeDeliveryAndSyncKardex = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'Entregada') {
      showToast('Ya entregada', `La orden ${order.opNumber} ya fue procesada anteriormente.`, 'info');
      return;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLogs: SyncLogEntry[] = [];
    const updatedInventory = [...inventory];

    // Descontar cada ítem del Kardex en tiempo real
    order.items.forEach(reqItem => {
      const idx = updatedInventory.findIndex(inv => inv.id === reqItem.itemId);
      if (idx !== -1) {
        const prev = updatedInventory[idx].currentStock;
        const deducted = Math.max(0, prev - reqItem.quantity);
        updatedInventory[idx] = {
          ...updatedInventory[idx],
          currentStock: deducted
        };

        newLogs.push({
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: nowStr,
          orderId: order.id,
          opNumber: order.opNumber,
          targetMachine: order.targetMachine,
          itemCode: reqItem.itemCode,
          itemDescription: reqItem.itemDescription,
          deductedQty: reqItem.quantity,
          unit: reqItem.unit,
          previousStock: prev,
          newStock: deducted,
          operator: 'Control de Despacho (Pie de Máquina)'
        });
      }
    });

    // Actualizar estado de la orden
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'Entregada' as DeliveryStatus,
          actualDeliveryTime: nowStr,
          leadTimeMinutes: Math.floor(Math.random() * 8) + 14, // 14 a 22 mins
          synchronized: true
        };
      }
      return o;
    });

    setInventory(updatedInventory);
    setOrders(updatedOrders);
    setSyncLogs(prev => [...newLogs, ...prev]);

    showToast(
      'Entrega Confirmada & Stock Descontado',
      `Se actualizaron ${order.items.length} ítems en el Kardex para ${order.targetMachine} (${order.opNumber}).`,
      'success'
    );
  };

  // Avanzar estado de la orden en el Kanban
  const advanceOrderStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'Solicitada') {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'En preparación' } : o));
      showToast('En Preparación', `${order.opNumber}: Auxiliar logístico inició picking en bodega.`, 'info');
    } else if (order.status === 'En preparación') {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'En tránsito' } : o));
      showToast('En Tránsito', `${order.opNumber}: Despacho hacia pie de máquina ${order.targetMachine}.`, 'info');
    } else if (order.status === 'En tránsito') {
      completeDeliveryAndSyncKardex(orderId);
    }
  };

  // Revertir una entrega (en caso de error de operario o auditoría)
  const revertDelivery = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'Entregada') return;

    const updatedInventory = [...inventory];
    order.items.forEach(reqItem => {
      const idx = updatedInventory.findIndex(inv => inv.id === reqItem.itemId);
      if (idx !== -1) {
        updatedInventory[idx] = {
          ...updatedInventory[idx],
          currentStock: updatedInventory[idx].currentStock + reqItem.quantity
        };
      }
    });

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'En tránsito' as DeliveryStatus,
          actualDeliveryTime: undefined,
          synchronized: false
        };
      }
      return o;
    });

    setInventory(updatedInventory);
    setOrders(updatedOrders);
    showToast('Entrega Revertida', `Se reintegró el stock de la ${order.opNumber} al Kardex.`, 'warning');
  };

  // Crear nueva solicitud desde Autorizaciones
  const handleCreateAuthorization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authOp.trim() || !authClient.trim()) {
      showToast('Campos requeridos', 'Por favor ingresa la OP y el nombre del cliente/trabajo.', 'warning');
      return;
    }

    const firstItem = inventory.find(i => i.id === authItemId);
    if (!firstItem) return;

    if (authItemQty <= 0) {
      showToast('Cantidad inválida', 'La cantidad del insumo debe ser mayor a cero.', 'warning');
      return;
    }

    // Verificar si la máquina soporta este insumo
    if (!firstItem.compatibleMachines.includes(authMachine)) {
      showToast(
        'Incompatibilidad de Máquina',
        `El material ${firstItem.code} no está configurado para la prensa ${authMachine}. Verifique especificaciones.`,
        'warning'
      );
      return;
    }

    const itemsToRequest = [
      {
        itemId: firstItem.id,
        itemCode: firstItem.code,
        itemDescription: firstItem.description,
        quantity: authItemQty,
        unit: firstItem.unit
      }
    ];

    if (authSecondItemId !== 'none' && authSecondItemQty > 0) {
      const secondItem = inventory.find(i => i.id === authSecondItemId);
      if (secondItem) {
        itemsToRequest.push({
          itemId: secondItem.id,
          itemCode: secondItem.code,
          itemDescription: secondItem.description,
          quantity: authSecondItemQty,
          unit: secondItem.unit
        });
      }
    }

    const newOrder: MaterialOrder = {
      id: `ord-${Date.now()}`,
      opNumber: authOp.toUpperCase(),
      client: authClient,
      targetMachine: authMachine,
      requestedBy: authRequester,
      authorizedBy: authApprover,
      authorizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: authPriority,
      items: itemsToRequest,
      status: 'Solicitada',
      transportMethod: authTransport,
      scheduledTime: new Date(Date.now() + 25 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: authNotes || 'Solicitud generada con validación técnica ISO 9001/12647.',
      synchronized: false
    };

    setOrders([newOrder, ...orders]);
    showToast(
      'Solicitud Autorizada',
      `Orden ${newOrder.opNumber} programada con éxito para ${newOrder.targetMachine}. Lista para picking.`,
      'success'
    );

    // Resetear formulario con nuevo número correlativo
    const nextOpNum = parseInt(authOp.replace('OP-2026-', '')) + 1;
    setAuthOp(`OP-2026-${isNaN(nextOpNum) ? '486' : nextOpNum}`);
    setAuthClient('');
    setAuthNotes('');
    setAuthSecondItemId('none');
    setAuthSecondItemQty(0);
  };

  // Ajuste manual de inventario
  const handleApplyStockAdjustment = () => {
    if (!selectedItemForAdjust) return;
    const newStock = Math.max(0, selectedItemForAdjust.currentStock + adjustQty);

    const updated = inventory.map(item => {
      if (item.id === selectedItemForAdjust.id) {
        return { ...item, currentStock: newStock };
      }
      return item;
    });

    setInventory(updated);
    setIsStockAdjustmentOpen(false);
    showToast(
      'Inventario Ajustado',
      `${selectedItemForAdjust.code}: Nuevo stock ${newStock.toLocaleString()} ${selectedItemForAdjust.unit} (${adjustReason}).`,
      'info'
    );
  };

  // Métricas calculadas para Desempeño
  const performanceMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Entregada');
    const onTimeOrders = deliveredOrders.filter(o => (o.leadTimeMinutes || 20) <= 25);
    const otifRate = deliveredOrders.length > 0 ? (onTimeOrders.length / deliveredOrders.length) * 100 : 96.2;

    const avgLeadTime = deliveredOrders.length > 0
      ? (deliveredOrders.reduce((acc, curr) => acc + (curr.leadTimeMinutes || 18), 0) / deliveredOrders.length).toFixed(1)
      : '17.8';

    const rolandOrders = orders.filter(o => o.targetMachine === 'Roland 700');
    const komoriOrders = orders.filter(o => o.targetMachine === 'Komori');

    const criticalItems = inventory.filter(i => i.currentStock <= i.minStock);

    return {
      totalOrders,
      deliveredOrders: deliveredOrders.length,
      otifRate: otifRate.toFixed(1),
      avgLeadTime,
      rolandCount: rolandOrders.length,
      komoriCount: komoriOrders.length,
      criticalCount: criticalItems.length,
      rolandDowntimeHours: 0.8,
      komoriDowntimeHours: 1.4,
      tolerances: {
        claseA: { target: '± 1.0%', actual: '0.6%' },
        claseB: { target: '± 2.5%', actual: '1.8%' },
        claseC: { target: '0.0%', actual: '0.0%' }
      }
    };
  }, [orders, inventory]);

  // Filtrado de Inventario en Kardex
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchAbc = abcFilter === 'all' || item.abcClass === abcFilter;
      const matchStatus = stockStatusFilter === 'all'
        ? true
        : stockStatusFilter === 'critical'
          ? item.currentStock <= item.minStock
          : item.currentStock > item.minStock;

      return matchSearch && matchCategory && matchAbc && matchStatus;
    });
  }, [inventory, searchTerm, categoryFilter, abcFilter, stockStatusFilter]);

  // Filtrado de Órdenes en Trazabilidad y Programación
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (machineFilter === 'all') return true;
      return order.targetMachine === machineFilter;
    });
  }, [orders, machineFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ==========================================
          TOAST FEEDBACK FLOTANTE
      ========================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 max-w-md transition-all duration-300">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toastMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          <div>
            <h4 className="font-semibold text-sm text-slate-100">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==========================================
          HEADER PRINCIPAL (TOP BAR CONTRACT)
      ========================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Zone 1: Brand wordmark & System context */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">IMPRESOS EL DÍA</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200">
                    S.A.S.
                  </span>
                </div>
                <div className="text-xs text-slate-500 hidden sm:block">
                  Control Logístico Bodega · Abastecimiento a Prensa
                </div>
              </div>
            </div>

            {/* Zone 2: Navigation Tabs (6 Functional Sections) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('kardex')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'kardex'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>1. Kardex</span>
                {performanceMetrics.criticalCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title={`${performanceMetrics.criticalCount} alertas`} />
                )}
              </button>

              <button
                onClick={() => setActiveTab('trazabilidad')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'trazabilidad'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>2. Trazabilidad</span>
              </button>

              <button
                onClick={() => setActiveTab('autorizaciones')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'autorizaciones'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>3. Autorizaciones</span>
              </button>

              <button
                onClick={() => setActiveTab('programacion')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'programacion'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>4. Programación</span>
              </button>

              <button
                onClick={() => setActiveTab('sincronizacion')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'sincronizacion'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>5. Sincronización</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Enlace en tiempo real activo" />
              </button>

              <button
                onClick={() => setActiveTab('desempeno')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'desempeno'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>6. Desempeño</span>
              </button>
            </nav>

            {/* Zone 3: Quick Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('autorizaciones');
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Solicitud OP</span>
              </button>

              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Prensas:</span>
                <span className="font-mono text-slate-900 font-medium">Roland 700 · Komori</span>
              </div>
            </div>
          </div>

          {/* Submenú en dispositivos móviles */}
          <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 no-scrollbar">
            {(['kardex', 'trazabilidad', 'autorizaciones', 'programacion', 'sincronizacion', 'desempeno'] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 capitalize ${
                  activeTab === tabKey
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tabKey}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ==========================================
          SUB-BANNER DE ESTADO OPERATIVO
      ========================================== */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400 font-medium">Estándares:</span>
              <span className="font-mono text-slate-700">ISO 9001 · ISO 12647 · ISO 45001</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">OTIF Actual:</span>
              <span className="font-semibold text-emerald-700 font-mono">{performanceMetrics.otifRate}%</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Lead Time Promedio:</span>
              <span className="font-semibold text-blue-700 font-mono">{performanceMetrics.avgLeadTime} min</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {performanceMetrics.criticalCount > 0 ? (
              <button
                onClick={() => {
                  setActiveTab('kardex');
                  setStockStatusFilter('critical');
                }}
                className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">{performanceMetrics.criticalCount} insumos bajo stock mínimo</span>
              </button>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stock en niveles óptimos
              </span>
            )}
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Sincronización automática: <strong className="text-emerald-600 font-semibold">Activa</strong></span>
          </div>
        </div>
      </div>

      {/* ==========================================
          CONTENIDO DINÁMICO SEGÚN PESTAÑA
      ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ----------------------------------------------------
            1. PESTAÑA KARDEX: INVENTARIO EN TIEMPO REAL CON ALERTAS
        ---------------------------------------------------- */}
        {activeTab === 'kardex' && (
          <div className="space-y-6">
            {/* Header del Kardex */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">1. Kardex de Inventario Litográfico</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Control en tiempo real de sustratos, planchas CTP, tintas CMYK y químicos con clasificación ABC y reposición automática.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedItemForAdjust(inventory[0]);
                    setAdjustQty(500);
                    setAdjustReason('Recepción de Proveedor');
                    setIsStockAdjustmentOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ingreso / Ajuste Físico</span>
                </button>
              </div>
            </div>

            {/* Tarjetas resumen de inventario ABC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Total Ítems en Bodega</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {inventory.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  100% catalogados según matriz ABC
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Clase A (Alta Criticidad)</span>
                  <span className="text-rose-600 font-bold font-mono">33%</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-rose-700 font-mono tabular-nums">
                  {inventory.filter(i => i.abcClass === 'A').length} <span className="text-xs font-normal text-slate-500">referencias</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Sustratos base, planchas y tintas de proceso
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Clase B & C (Media / MRO)</span>
                  <span className="text-amber-600 font-bold font-mono">67%</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-700 font-mono tabular-nums">
                  {inventory.filter(i => i.abcClass !== 'A').length} <span className="text-xs font-normal text-slate-500">referencias</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Barnices, adhesivos, solventes y repuestos
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Alertas Stock Mínimo</span>
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-600 font-mono tabular-nums">
                  {performanceMetrics.criticalCount}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Requieren orden de compra urgente
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, descripción (ej: Maule, Cyan, CTP)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Categoría:</span>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="Papel y Cartón">Papel y Cartón</option>
                  <option value="Tintas CMYK">Tintas CMYK</option>
                  <option value="Planchas CTP">Planchas CTP</option>
                  <option value="Químicos y Barnices">Químicos y Barnices</option>
                  <option value="Acabados y MRO">Acabados y MRO</option>
                </select>

                <select
                  value={abcFilter}
                  onChange={(e) => setAbcFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Todas las Clases ABC</option>
                  <option value="A">Clase A (Crítico)</option>
                  <option value="B">Clase B (Moderado)</option>
                  <option value="C">Clase C (Especial/MRO)</option>
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="critical">Bajo Stock Mínimo</option>
                  <option value="normal">Nivel Normal</option>
                </select>
              </div>
            </div>

            {/* Tabla de Inventario Principal */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Código / Ítem</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-center">Clase ABC</th>
                      <th className="py-3 px-4 text-right">Stock Actual</th>
                      <th className="py-3 px-4 text-right">Stock Mínimo</th>
                      <th className="py-3 px-4 text-center">Estado de Stock</th>
                      <th className="py-3 px-4">Ubicación Bodega</th>
                      <th className="py-3 px-4">Máquinas Aptas</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No se encontraron materiales con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map(item => {
                        const isLowStock = item.currentStock <= item.minStock;
                        const stockRatio = (item.currentStock / item.minStock) * 100;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isLowStock ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-slate-900">{item.code}</div>
                              <div className="text-slate-600 font-medium max-w-xs truncate" title={item.description}>
                                {item.description}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {item.category}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center font-bold font-mono text-xs w-6 h-6 rounded-md ${
                                  item.abcClass === 'A'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : item.abcClass === 'B'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {item.abcClass}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                              <span className={isLowStock ? 'text-amber-700' : 'text-slate-900'}>
                                {item.currentStock.toLocaleString()}
                              </span>
                              <span className="text-slate-400 font-normal ml-1 text-[11px]">{item.unit}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-500 tabular-nums">
                              {item.minStock.toLocaleString()}
                              <span className="ml-1 text-[11px]">{item.unit}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Stock Crítico ({Math.round(stockRatio)}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Óptimo
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="font-mono text-[11px]">{item.location}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {item.compatibleMachines.map(m => (
                                  <span
                                    key={m}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      m === 'Roland 700'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedItemForAdjust(item);
                                  setAdjustQty(item.minStock);
                                  setAdjustReason('Reposición de Stock');
                                  setIsStockAdjustmentOpen(true);
                                }}
                                className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors font-medium text-[11px]"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            2. PESTAÑA TRAZABILIDAD: PANEL KANBAN / LISTA EN VIVO
        ---------------------------------------------------- */}
        {activeTab === 'trazabilidad' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">2. Trazabilidad en Vivo de Suministros</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Monitoreo secuencial del flujo de bodega a pie de máquina: Solicitada → En preparación → En tránsito → Entregada.
                </p>
              </div>

              {/* Selector de Máquina */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 pl-2 font-medium">Filtrar Máquina:</span>
                <button
                  onClick={() => setMachineFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    machineFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({orders.length})
                </button>
                <button
                  onClick={() => setMachineFilter('Roland 700')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    machineFilter === 'Roland 700'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Roland 700 ({orders.filter(o => o.targetMachine === 'Roland 700').length})
                </button>
                <button
                  onClick={() => setMachineFilter('Komori')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    machineFilter === 'Komori'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Komori ({orders.filter(o => o.targetMachine === 'Komori').length})
                </button>
              </div>
            </div>

            {/* TABLERO KANBAN DE 4 COLUMNAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Columna 1: Solicitada */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <h3 className="font-semibold text-xs text-slate-800">1. SOLICITADA</h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {filteredOrders.filter(o => o.status === 'Solicitada').length}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredOrders.filter(o => o.status === 'Solicitada').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-white/50 rounded-lg border border-dashed border-slate-200">
                      Sin solicitudes pendientes
                    </div>
                  ) : (
                    filteredOrders.filter(o => o.status === 'Solicitada').map(order => (
                      <div key={order.id} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.opNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.targetMachine === 'Roland 700'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {order.targetMachine}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1 font-medium">
                          {order.client}
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span className="truncate pr-1">{it.itemCode}</span>
                              <span className="font-mono font-semibold shrink-0">{it.quantity.toLocaleString()} {it.unit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Hora req: <strong>{order.scheduledTime}</strong></span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            order.priority === 'Urgente'
                              ? 'bg-rose-100 text-rose-700'
                              : order.priority === 'Alta'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.priority}
                          </span>
                        </div>
                        <button
                          onClick={() => advanceOrderStatus(order.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors mt-2"
                        >
                          <span>Iniciar Picking</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Columna 2: En preparación */}
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-semibold text-xs text-amber-900">2. EN PREPARACIÓN</h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                    {filteredOrders.filter(o => o.status === 'En preparación').length}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredOrders.filter(o => o.status === 'En preparación').length === 0 ? (
                    <div className="p-4 text-center text-xs text-amber-600/70 bg-white/50 rounded-lg border border-dashed border-amber-200">
                      No hay pedidos en picking
                    </div>
                  ) : (
                    filteredOrders.filter(o => o.status === 'En preparación').map(order => (
                      <div key={order.id} className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.opNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.targetMachine === 'Roland 700'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {order.targetMachine}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1 font-medium">
                          {order.client}
                        </div>
                        <div className="bg-amber-50/50 p-2 rounded border border-amber-100 text-[11px] space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span className="truncate pr-1">{it.itemCode}</span>
                              <span className="font-mono font-semibold shrink-0">{it.quantity.toLocaleString()} {it.unit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Medio: <strong className="text-slate-700">{order.transportMethod}</strong></span>
                        </div>
                        <button
                          onClick={() => advanceOrderStatus(order.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors mt-2"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Despachar a Ruta</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Columna 3: En tránsito */}
              <div className="bg-sky-50/60 rounded-xl p-3 border border-sky-200">
                <div className="flex items-center justify-between pb-3 border-b border-sky-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <h3 className="font-semibold text-xs text-sky-900">3. EN TRÁNSITO</h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                    {filteredOrders.filter(o => o.status === 'En tránsito').length}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredOrders.filter(o => o.status === 'En tránsito').length === 0 ? (
                    <div className="p-4 text-center text-xs text-sky-600/70 bg-white/50 rounded-lg border border-dashed border-sky-200">
                      No hay traslados en curso
                    </div>
                  ) : (
                    filteredOrders.filter(o => o.status === 'En tránsito').map(order => (
                      <div key={order.id} className="bg-white p-3.5 rounded-lg border border-sky-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.opNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.targetMachine === 'Roland 700'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {order.targetMachine}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          Ruta interna: Bodega → Pie de {order.targetMachine}
                        </div>
                        <div className="bg-sky-50 p-2 rounded border border-sky-100 text-[11px] space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span className="truncate pr-1">{it.itemCode}</span>
                              <span className="font-mono font-semibold shrink-0">{it.quantity.toLocaleString()} {it.unit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Vehículo: {order.transportMethod}</span>
                        </div>
                        <button
                          onClick={() => completeDeliveryAndSyncKardex(order.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors mt-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Entrega y Descontar</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Columna 4: Entregada */}
              <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-semibold text-xs text-emerald-900">4. ENTREGADA (SINCRONIZADO)</h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                    {filteredOrders.filter(o => o.status === 'Entregada').length}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredOrders.filter(o => o.status === 'Entregada').length === 0 ? (
                    <div className="p-4 text-center text-xs text-emerald-600/70 bg-white/50 rounded-lg border border-dashed border-emerald-200">
                      Sin entregas completadas hoy
                    </div>
                  ) : (
                    filteredOrders.filter(o => o.status === 'Entregada').map(order => (
                      <div key={order.id} className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.opNumber}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Kardex Descontado
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          Máquina: <strong className="text-slate-800">{order.targetMachine}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5 bg-slate-50 p-2 rounded">
                          <div>Entrega: <strong>{order.actualDeliveryTime || order.scheduledTime}</strong></div>
                          <div>Lead Time: <strong className="font-mono text-emerald-700">{order.leadTimeMinutes || 18} min</strong></div>
                          <div>Autorizó: {order.authorizedBy.split(' ')[0]} {order.authorizedBy.split(' ')[1]}</div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => revertDelivery(order.id)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                            title="Revertir si hubo error en pie de máquina"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revertir Stock</span>
                          </button>
                          <span className="text-[10px] text-slate-400">Verificado</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            3. PESTAÑA AUTORIZACIONES: FORMULARIO DIGITAL DE VALIDACIÓN
        ---------------------------------------------------- */}
        {activeTab === 'autorizaciones' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">3. Autorizaciones y Requerimientos de Insumos</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Formulario digital estandarizado según la norma ISO 9001 / ISO 12647 para eliminar solicitudes informales en papel y validar requerimientos técnicos antes del despacho.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Formulario Principal */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <form onSubmit={handleCreateAuthorization} className="space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-blue-600" />
                      <span>Formulario de Solicitud de Materiales a Prensa</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Código documental: FOR-LOG-02 (Versión 01 - Impresos El Día S.A.S.)
                    </p>
                  </div>

                  {/* Fila 1: OP y Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Número de Orden de Producción (OP) *
                      </label>
                      <input
                        type="text"
                        required
                        value={authOp}
                        onChange={(e) => setAuthOp(e.target.value)}
                        placeholder="OP-2026-485"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cliente / Referencia del Trabajo *
                      </label>
                      <input
                        type="text"
                        required
                        value={authClient}
                        onChange={(e) => setAuthClient(e.target.value)}
                        placeholder="Ej: Laboratorios Baxter - Caja Ampolla 10ml"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Selector OBLIGATORIO de Máquina y Prioridad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        Máquina Destino (OBLIGATORIO) *
                      </label>
                      <select
                        value={authMachine}
                        onChange={(e) => setAuthMachine(e.target.value as MachineTarget)}
                        className="w-full px-3 py-2 text-xs bg-blue-50/50 border-2 border-blue-400 rounded-lg font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Roland 700">Roland 700 (Offset Gran Formato)</option>
                        <option value="Komori">Komori (Offset Medio Pliego)</option>
                      </select>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Valida compatibilidad dimensional de sustratos y planchas CTP.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nivel de Prioridad Operativa
                      </label>
                      <select
                        value={authPriority}
                        onChange={(e) => setAuthPriority(e.target.value as PriorityLevel)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Normal">Normal (Programación regular del turno)</option>
                        <option value="Alta">Alta (Línea próxima a desabastecerse)</option>
                        <option value="Urgente">Urgente (Parada inminente de máquina)</option>
                      </select>
                    </div>
                  </div>

                  {/* Insumo Principal Requerido */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      1. Insumo Principal (Papel / Cartón o Planchas)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Seleccionar Material
                        </label>
                        <select
                          value={authItemId}
                          onChange={(e) => setAuthItemId(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                              [{item.code}] {item.description} (Disp: {item.currentStock.toLocaleString()} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cantidad Requerida
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={authItemQty}
                          onChange={(e) => setAuthItemQty(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Insumo Secundario (Opcional - Tintas o Químicos) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      2. Insumo Secundario Complementario (Tintas / Barniz / Químico)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Material Adicional (Opcional)
                        </label>
                        <select
                          value={authSecondItemId}
                          onChange={(e) => setAuthSecondItemId(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="none">-- Sin insumo adicional --</option>
                          {inventory.filter(i => i.category === 'Tintas CMYK' || i.category === 'Químicos y Barnices' || i.category === 'Planchas CTP').map(item => (
                            <option key={item.id} value={item.id}>
                              [{item.code}] {item.description} (Disp: {item.currentStock.toLocaleString()} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cantidad Adicional
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={authSecondItemId === 'none'}
                          value={authSecondItemQty}
                          onChange={(e) => setAuthSecondItemQty(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logística Interna y Firmas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Operario Solicitante (Prensa)
                      </label>
                      <input
                        type="text"
                        value={authRequester}
                        onChange={(e) => setAuthRequester(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jefatura que Autoriza (Calidad/Planta)
                      </label>
                      <select
                        value={authApprover}
                        onChange={(e) => setAuthApprover(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="Ing. Mariana Sinitave (Jefa Producción)">Ing. Mariana Sinitave (Jefa Producción)</option>
                        <option value="Miguel Palacio (Jefe de Planta)">Miguel Palacio (Jefe de Planta)</option>
                        <option value="Auditor HSEQ Líder">Auditor HSEQ Líder</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Medio de Transporte Interno
                      </label>
                      <select
                        value={authTransport}
                        onChange={(e) => setAuthTransport(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="Montacargas eléctrico">Montacargas eléctrico</option>
                        <option value="Transpaleta hidráulica">Transpaleta hidráulica</option>
                        <option value="Carro multipropósito">Carro multipropósito</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observaciones / Instrucciones de Estibado (ISO 12647)
                    </label>
                    <textarea
                      rows={2}
                      value={authNotes}
                      onChange={(e) => setAuthNotes(e.target.value)}
                      placeholder="Ej: Proteger bordes del papel esmaltado con esquineros plásticos; no exceder límite de altura de apilamiento."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthClient('Laboratorios Genfar S.A.');
                        setAuthNotes('Requerimiento prioritario para tiraje nocturno.');
                      }}
                      className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cargar Ejemplo Rápido
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar y Emitir Requerimiento Digital</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Guía de Control Operativo y Buenas Prácticas */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    <span>Criterios de Aceptación (Auditoría PHVA)</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Validación de OP:</strong> Debe coincidir diseño aprobado con el gramaje y calibre del sustrato.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Condición Ambiental (ISO 12647):</strong> Sustratos aclimatados con control de humedad antes del tiraje.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Control de Apilamiento:</strong> No sobrepasar la altura reglamentaria para evitar deformación de bordes.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Capacidad de Prensas</span>
                    <Printer className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="font-bold text-white flex justify-between">
                        <span>Roland 700</span>
                        <span className="text-indigo-400 font-mono">Gran Formato</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Planchas: 1030×790 mm · Sustratos hasta 72×102 cm
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="font-bold text-white flex justify-between">
                        <span>Komori</span>
                        <span className="text-emerald-400 font-mono">Medio Pliego</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Planchas: 745×605 mm · Sustratos hasta 50×70 cm / 70×100 cm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            4. PESTAÑA PROGRAMACIÓN DE ENTREGAS: MÓDULO ROLAND 700 / KOMORI
        ---------------------------------------------------- */}
        {activeTab === 'programacion' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">4. Programación de Entregas a Prensa</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Planificación de despachos con selector obligatorio de máquina de destino ("Roland 700" o "Komori") y control de rutas lecheras.
                </p>
              </div>

              {/* Botón de cambio rápido */}
              <button
                onClick={() => setActiveTab('autorizaciones')}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Nueva OP</span>
              </button>
            </div>

            {/* Selector de Máquina Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloque Roland 700 */}
              <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      R
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">ROLAND 700 (Offset Gran Formato)</h2>
                      <p className="text-xs text-indigo-700 font-medium">Planchas CTP 1030×790 mm · Empaques y Estuchería</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200">
                    {orders.filter(o => o.targetMachine === 'Roland 700').length} órdenes
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.filter(o => o.targetMachine === 'Roland 700').length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No hay despachos programados para Roland 700 hoy.
                    </div>
                  ) : (
                    orders.filter(o => o.targetMachine === 'Roland 700').map(ord => (
                      <div key={ord.id} className="p-3.5 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-indigo-950">{ord.opNumber}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            ord.status === 'Entregada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'En tránsito'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">{ord.client}</div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.itemDescription}</span>
                              <strong className="font-mono">{it.quantity.toLocaleString()} {it.unit}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Hora: <strong>{ord.scheduledTime}</strong></span>
                          <span>Medio: <strong>{ord.transportMethod}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bloque Komori */}
              <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      K
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">KOMORI (Offset Medio Pliego)</h2>
                      <p className="text-xs text-emerald-700 font-medium">Planchas CTP 745×605 mm · Revistas y Papelería Comercial</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                    {orders.filter(o => o.targetMachine === 'Komori').length} órdenes
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.filter(o => o.targetMachine === 'Komori').length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No hay despachos programados para Komori hoy.
                    </div>
                  ) : (
                    orders.filter(o => o.targetMachine === 'Komori').map(ord => (
                      <div key={ord.id} className="p-3.5 bg-emerald-50/40 rounded-lg border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-emerald-950">{ord.opNumber}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            ord.status === 'Entregada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'En tránsito'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">{ord.client}</div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.itemDescription}</span>
                              <strong className="font-mono">{it.quantity.toLocaleString()} {it.unit}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Hora: <strong>{ord.scheduledTime}</strong></span>
                          <span>Medio: <strong>{ord.transportMethod}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Protocolo de Ruta Lechera / Milk Run (Paso 4 de la Guía) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Protocolo de Entrega Programada: Milk Run (Ruta Lechera Cada 2 Horas)</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Para evitar saturación de pasillos y prevenir paradas imprevistas de prensa, los suministros menores (tintas, barnices, mantillas) se despachan en tandas sincronizadas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">Tanda 1 (Mañana)</div>
                  <div className="font-mono text-blue-600 text-[11px] font-semibold">08:00 AM - 08:30 AM</div>
                  <div className="text-slate-500 text-[11px] mt-1">Sustratos base y planchas CTP de inicio de tiraje</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">Tanda 2 (Media Mañana)</div>
                  <div className="font-mono text-blue-600 text-[11px] font-semibold">10:30 AM - 11:00 AM</div>
                  <div className="text-slate-500 text-[11px] mt-1">Reposición de tintas CMYK y soluciones de mojado</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">Tanda 3 (Tarde)</div>
                  <div className="font-mono text-blue-600 text-[11px] font-semibold">02:00 PM - 02:30 PM</div>
                  <div className="text-slate-500 text-[11px] mt-1">Sustratos de segunda tanda y barnices protectores</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">Tanda 4 (Cierre Turno)</div>
                  <div className="font-mono text-blue-600 text-[11px] font-semibold">04:30 PM - 05:00 PM</div>
                  <div className="text-slate-500 text-[11px] mt-1">Devolución de tintas directas pesadas y mermas</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            5. PESTAÑA SINCRONIZACIÓN: DESCUENTO AUTOMÁTICO EN TIEMPO REAL
        ---------------------------------------------------- */}
        {activeTab === 'sincronizacion' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">5. Sincronización Automática en Tiempo Real</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Descuento instantáneo en el Kardex al marcar una entrega como "Entregada" en pie de máquina. Registro inmutable de transacciones.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Puente Activo: 0 Discrepancias Físicas</span>
              </div>
            </div>

            {/* Simulador Interactivo de Descuento en Tiempo Real */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-blue-600" />
                    <span>Órdenes Listas para Confirmar Descuento de Stock</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haga clic en "Confirmar y Descontar" en cualquier entrega en tránsito para observar el recálculo automático en el Kardex.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.filter(o => o.status !== 'Entregada').length === 0 ? (
                  <div className="col-span-2 py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    Todas las órdenes actuales ya han sido entregadas y sincronizadas con el Kardex.
                  </div>
                ) : (
                  orders.filter(o => o.status !== 'Entregada').map(ord => (
                    <div key={ord.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-slate-900">{ord.opNumber}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            ord.targetMachine === 'Roland 700'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ord.targetMachine}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1">{ord.client}</div>
                        <div className="mt-2 text-xs space-y-1">
                          {ord.items.map((it, idx) => {
                            const invItem = inventory.find(i => i.id === it.itemId);
                            const currentStock = invItem ? invItem.currentStock : 0;
                            const stockAfter = Math.max(0, currentStock - it.quantity);

                            return (
                              <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-[11px] flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-slate-800">{it.itemCode}</span>
                                  <span className="text-slate-500 ml-1">({it.quantity} {it.unit})</span>
                                </div>
                                <div className="font-mono text-slate-600 text-right">
                                  <span>{currentStock.toLocaleString()}</span>
                                  <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                                  <strong className="text-blue-700">{stockAfter.toLocaleString()}</strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => completeDeliveryAndSyncKardex(ord.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Recepción y Descontar Kardex Ahora</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Registro de Auditoría de Sincronización (Ledger) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Libro de Movimientos Sincronizados (Kardex Ledger)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Historial en tiempo real de cada descuento aplicado por despacho</p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {syncLogs.length} transacciones registradas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3 px-4">N° Orden (OP)</th>
                      <th className="py-3 px-4">Máquina</th>
                      <th className="py-3 px-4">Material Descontado</th>
                      <th className="py-3 px-4 text-right">Cantidad Descontada</th>
                      <th className="py-3 px-4 text-right">Stock Anterior</th>
                      <th className="py-3 px-4 text-right">Stock Resultante</th>
                      <th className="py-3 px-4">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {syncLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          No hay transacciones registradas hoy.
                        </td>
                      </tr>
                    ) : (
                      syncLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{log.opNumber}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-sans font-semibold text-[10px] ${
                              log.targetMachine === 'Roland 700'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {log.targetMachine}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-800">
                            <strong>{log.itemCode}</strong> - {log.itemDescription}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-bold">
                            -{log.deductedQty.toLocaleString()} {log.unit}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {log.previousStock.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {log.newStock.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600">{log.operator}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            6. PESTAÑA DESEMPEÑO: DASHBOARD CON MÉTRICAS CLAVE
        ---------------------------------------------------- */}
        {activeTab === 'desempeno' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">6. Indicadores de Desempeño Logístico (KPIs)</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Medición continua del nivel de servicio interno, tiempos de ciclo y paradas de línea por máquina según ISO 9001 / ISO 12647.
              </p>
            </div>

            {/* 4 Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>OTIF (On-Time In-Full)</span>
                  <span className="text-emerald-600 font-semibold text-xs">Meta: ≥ 95%</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {performanceMetrics.otifRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">+1.4%</span> vs semana anterior
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Lead Time Promedio</span>
                  <span className="text-blue-600 font-semibold text-xs">Meta: ≤ 25 min</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-700 font-mono tabular-nums">
                  {performanceMetrics.avgLeadTime} <span className="text-sm font-normal text-slate-500">min</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reducción de 4 min en picking</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Paradas Roland 700 (Mes)</span>
                  <span className="text-indigo-600 font-semibold text-xs">Gran Formato</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {performanceMetrics.rolandDowntimeHours} <span className="text-sm font-normal text-slate-500">horas</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  0 paradas en los últimos 7 días
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Paradas Komori (Mes)</span>
                  <span className="text-emerald-600 font-semibold text-xs">Medio Pliego</span>
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {performanceMetrics.komoriDowntimeHours} <span className="text-sm font-normal text-slate-500">horas</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  1 demora por ajuste de filmación CTP
                </div>
              </div>
            </div>

            {/* Comparativa por Máquina (Roland 700 vs Komori) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>Comparativa Operativa: Roland 700 vs Komori</span>
                  <Printer className="w-4 h-4 text-slate-400" />
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">Volumen de Despachos Programados</span>
                      <span className="font-mono text-slate-500">
                        Roland ({performanceMetrics.rolandCount}) vs Komori ({performanceMetrics.komoriCount})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full"
                        style={{ width: `${(performanceMetrics.rolandCount / Math.max(1, performanceMetrics.totalOrders)) * 100}%` }}
                      />
                      <div
                        className="bg-emerald-600 h-full"
                        style={{ width: `${(performanceMetrics.komoriCount / Math.max(1, performanceMetrics.totalOrders)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span className="text-indigo-700 font-medium">■ Roland 700: {Math.round((performanceMetrics.rolandCount / Math.max(1, performanceMetrics.totalOrders)) * 100)}%</span>
                      <span className="text-emerald-700 font-medium">■ Komori: {Math.round((performanceMetrics.komoriCount / Math.max(1, performanceMetrics.totalOrders)) * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">Tiempo Medio de Surtido a Máquina</span>
                      <span className="font-mono text-slate-500">Minutos desde solicitud</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-[11px] font-medium text-slate-600">Roland 700</span>
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: '64%' }} />
                        </div>
                        <span className="font-mono font-bold text-slate-800 w-12 text-right">16 min</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-[11px] font-medium text-slate-600">Komori</span>
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: '76%' }} />
                        </div>
                        <span className="font-mono font-bold text-slate-800 w-12 text-right">19 min</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block">Diagnóstico de Productividad de Planta:</span>
                    <p className="text-slate-600 leading-relaxed">
                      El canal digital redujo las órdenes con discrepancia en un 94%. El uso de estibadores hidráulicos y montacargas delimitados por pasillos eliminó los cuellos de botella en el abastecimiento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cumplimiento de Tolerancias en Taller Gráfico (Documento PROP-INV-2026-01) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>Tolerancias y Mermas (PROP-INV-2026-01)</span>
                  <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    Norma Técnica
                  </span>
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Sustratos y Papeles (Clase A)</div>
                      <div className="text-slate-500 text-[11px]">Tolerancia máxima permitida: ± 1.0%</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm">0.6%</span>
                      <div className="text-[10px] text-emerald-600 font-semibold">Dentro de límite</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Tintas y Químicos (Clase B)</div>
                      <div className="text-slate-500 text-[11px]">Tolerancia máxima permitida: ± 2.5%</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm">1.8%</span>
                      <div className="text-[10px] text-emerald-600 font-semibold">Dentro de límite</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Planchas y Repuestos MRO (Clase C)</div>
                      <div className="text-slate-500 text-[11px]">Tolerancia máxima permitida: 0.0% (Unidad exacta)</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm">0.0%</span>
                      <div className="text-[10px] text-emerald-600 font-semibold">Conteo Exacto</div>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-500 text-[11px] leading-relaxed">
                    * Lineamiento operativo: Toda tinta pantone devuelta se pesa en báscula gramera para actualizar el peso neto en el Kardex.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL DE AJUSTE MANUAL DE INVENTARIO
      ========================================== */}
      {isStockAdjustmentOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Ajuste / Ingreso Físico de Stock</h3>
              <button
                onClick={() => setIsStockAdjustmentOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-mono font-bold text-slate-900">{selectedItemForAdjust.code}</div>
                <div className="text-slate-600 font-medium">{selectedItemForAdjust.description}</div>
                <div className="mt-2 text-slate-500 flex justify-between">
                  <span>Stock Actual en Kardex:</span>
                  <strong className="font-mono text-slate-800">{selectedItemForAdjust.currentStock.toLocaleString()} {selectedItemForAdjust.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cantidad a Ingresar / Ajustar (+ o -)
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nuevo stock proyectado: <strong className="font-mono text-blue-700">{(selectedItemForAdjust.currentStock + adjustQty).toLocaleString()} {selectedItemForAdjust.unit}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo del Movimiento
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Recepción de Proveedor">Recepción de Factura / Proveedor</option>
                  <option value="Reposición de Stock">Reposición Periódica Programada</option>
                  <option value="Conteo Cíclico Semanal">Ajuste por Conteo Cíclico Semanal</option>
                  <option value="Devolución de Prensa">Devolución de Prensa (Sobrantes útiles)</option>
                  <option value="Segregación por Merma">Baja por Daño Físico / Merma</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStockAdjustmentOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyStockAdjustment}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
              >
                Aplicar al Kardex
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FOOTER CORPORATIVO
      ========================================== */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">Impresos El Día S.A.S.</span> · Sistema de Gestión de Bodega y Abastecimiento a Prensa
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>NIT: 890.903.512-1</span>
            <span>·</span>
            <span>Versión 2.4 (Producción Vercel)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
