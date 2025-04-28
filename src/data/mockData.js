// src/data/mockData.js
export const mockContacts = [
  {
    id: 1,
    name: 'João Silva',
    lastMessage: 'Vamos fechar aquela proposta?',
    time: '12:45',
    unread: 3,
    online: true
  },
  {
    id: 2,
    name: 'Maria Santos',
    lastMessage: 'Obrigado pela parceria!',
    time: '11:32',
    unread: 1,
    online: false
  },
  {
    id: 3,
    name: 'Carlos Oliveira',
    lastMessage: 'Podemos agendar uma reunião?',
    time: 'Ontem',
    unread: 0,
    online: false
  },
  {
    id: 4,
    name: 'Ana Pereira',
    lastMessage: 'O projeto está andando bem',
    time: 'Ontem',
    unread: 0,
    online: true
  },
  {
    id: 5,
    name: 'Pedro Costa',
    lastMessage: 'Novidades sobre o contrato',
    time: '2d',
    unread: 0,
    online: false
  },
];

export const mockMessages = [
  {
    id: 1,
    content: 'Olá, tudo bem?',
    sender: 'user',
    time: '09:00',
  },
  {
    id: 2,
    content: 'Oi! Tudo ótimo, e com você?',
    sender: 'contact',
    time: '09:01',
  },
  {
    id: 3,
    content: 'Podemos conversar sobre aquela proposta?',
    sender: 'user',
    time: '09:02',
  },
];