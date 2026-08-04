// ─── Exames de Imagem Tab ─────────────────────────────────────────────────────
// This file is appended to PacienteDetailTabs.tsx via the Node.js script
// TEMPORARY - will be merged into the main file

import { useState } from 'react'

const SISTEMAS_EXAME = {
  WBSRAD: { url: 'https://www.wbsrad.com.br/site/', login: 'hospitalmemorial@exame.com.br', senha: '123456', label: 'Hospital Memorial (WBSRad)' },
  EPACS: { url: 'https://app.epacs.com.br/router/login/', login: 'medicocmt1@gmail.com', senha: 'medico', label: 'Walfredo Gurgel (EPACS)' },
}
const TIPOS_EXAME = ['RX', 'TC', 'RM', 'ECO', 'ECG', 'OUTRO']
