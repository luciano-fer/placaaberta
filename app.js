/* Placa Aberta - protótipo navegável do site. Tudo aqui é fictício e fica só no navegador. */
(function () {
  'use strict';

  // ---------- estado ----------
  var CHAVE = 'placaaberta_demo_v1';
  var memoria = null;
  function estadoInicial() {
    return {
      usuario: null,
      creditos: { basica: 0, completa: 0 },
      assinatura: false,
      consultas: [],
      desbloqueadas: {},
      monitorados: [],
      pagamentos: [],
      carrinho: null,
      prefs: { email: true, whatsapp: true, push: true, novidades: false, resumo: true }
    };
  }
  function ler() {
    if (memoria) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CHAVE)) || estadoInicial(); }
    catch (e) { memoria = estadoInicial(); }
    return memoria;
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(memoria)); } catch (e) {} }
  var E = ler();

  // ---------- utilidades ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function moeda(v) { return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function hoje() { var d = new Date(); return d.toLocaleDateString('pt-BR'); }
  function limpar(p) { return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function valida(p) { return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p); }
  function fmt(p) { return /^[A-Z]{3}[0-9]{4}$/.test(p) ? p.slice(0, 3) + '-' + p.slice(3) : p; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function escolhe(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('ver'); }, 2600); }
  function ir(rota) { location.hash = rota; }
  function totalCreditos() { return E.creditos.basica + E.creditos.completa; }

  // ---------- veículos fictícios ----------
  var MODELOS = [
    ['Volkswagen', 'Polo Highline 1.0 TSI'], ['Volkswagen', 'T-Cross Comfortline 200 TSI'], ['Chevrolet', 'Onix LT 1.0 Turbo'],
    ['Chevrolet', 'Tracker Premier 1.2 Turbo'], ['Fiat', 'Argo Drive 1.3'], ['Fiat', 'Pulse Audace 1.0 Turbo'],
    ['Toyota', 'Corolla XEi 2.0'], ['Hyundai', 'HB20 Comfort 1.0'], ['Honda', 'Civic EXL 2.0'], ['Renault', 'Kwid Zen 1.0'],
    ['Jeep', 'Compass Longitude 1.3 T270'], ['Nissan', 'Kicks SV 1.6']
  ];
  var CORES = ['Prata', 'Branco', 'Preto', 'Cinza', 'Vermelho', 'Azul'];
  var CIDADES = ['São Paulo, SP', 'Campinas, SP', 'Santo André, SP', 'Guarulhos, SP', 'Sorocaba, SP', 'Curitiba, PR', 'Belo Horizonte, MG', 'Ribeirão Preto, SP'];
  var INFRACOES = [
    ['Excesso de velocidade em até 20%', 130.16, 'Média'], ['Estacionar em local proibido', 195.23, 'Grave'],
    ['Avançar o sinal vermelho', 293.47, 'Gravíssima'], ['Usar o celular ao dirigir', 293.47, 'Gravíssima'],
    ['Transitar em faixa exclusiva', 293.47, 'Gravíssima'], ['Deixar de usar o cinto', 195.23, 'Grave']
  ];
  function veiculo(placa) {
    var r = rng(hash(placa)); var m = escolhe(r, MODELOS); var ano = 2013 + Math.floor(r() * 11);
    var nMultas = Math.floor(r() * 4); var multas = [];
    for (var i = 0; i < nMultas; i++) {
      var inf = escolhe(r, INFRACOES); var aberta = r() < 0.55;
      multas.push({ data: (1 + Math.floor(r() * 27)) + '/' + (1 + Math.floor(r() * 12)) + '/' + (2023 + Math.floor(r() * 3)), desc: inf[0], valor: inf[1], gravidade: inf[2], local: escolhe(r, CIDADES), orgao: escolhe(r, ['Municipal', 'Estadual', 'Renainf']), aberta: aberta });
    }
    var ipva = r() < 0.25; var gravame = r() < 0.35; var leilao = r() < 0.12; var sinistro = r() < 0.1;
    var trajeto = [escolhe(r, CIDADES)]; var nT = 1 + Math.floor(r() * 3);
    for (var j = 0; j < nT; j++) { var c = escolhe(r, CIDADES); if (c !== trajeto[trajeto.length - 1]) trajeto.push(c); }
    var fipe = 38000 + Math.floor(r() * 120) * 1000;
    var abertas = multas.filter(function (x) { return x.aberta; });
    var indice = Math.max(18, 96 - abertas.length * 9 - (ipva ? 14 : 0) - (gravame ? 6 : 0) - (leilao ? 22 : 0) - (sinistro ? 25 : 0) - Math.floor(r() * 6));
    return {
      placa: placa, marca: m[0], modelo: m[1], ano: ano + '/' + (ano + (r() < 0.6 ? 1 : 0)), combustivel: r() < 0.8 ? 'Flex' : 'Gasolina', cor: escolhe(r, CORES),
      municipio: trajeto[trajeto.length - 1], licenciado: !ipva, ipva: ipva ? 1980 + Math.floor(r() * 30) * 50 : 0,
      multas: multas, gravame: gravame, financeira: gravame ? escolhe(r, ['Banco Exemplo S.A.', 'Financeira Modelo S.A.', 'Crédito Fictício S.A.']) : '',
      leilao: leilao, sinistro: sinistro, roubo: false, recall: r() < 0.3, proprietarios: 1 + Math.floor(r() * 4), trajeto: trajeto,
      fipe: fipe, indice: indice
    };
  }
  function corIndice(i) { return i >= 75 ? 'var(--verde)' : i >= 50 ? 'var(--aviso)' : 'var(--alerta)'; }
  function veredito(i) { return i >= 75 ? 'Situação tranquila' : i >= 50 ? 'Pede atenção' : 'Pontos críticos'; }

  // ---------- planos ----------
  var PLANOS = {
    basica: { id: 'basica', nome: 'Consulta Básica', preco: 19.90, creditos: { basica: 1 }, desc: 'Para conferir a situação antes de fechar negócio.',
      itens: ['Dados do veículo', 'Situação e licenciamento', 'Débitos de IPVA e licenciamento', 'Multas por órgão autuador', 'Restrições e roubo ou furto'],
      fora: ['Gravame e financiamento', 'Leilão e sinistro', 'Histórico de municípios'] },
    completa: { id: 'completa', nome: 'Consulta Completa', preco: 34.90, creditos: { completa: 1 }, desc: 'A ficha inteira para comprar com segurança.', destaque: true,
      itens: ['Tudo da Básica', 'Gravame e financiamento', 'Histórico de leilão', 'Sinistro e perda total', 'Recall do fabricante', 'Histórico de municípios e proprietários', 'Preço de referência'], fora: [] },
    pacote: { id: 'pacote', nome: 'Pacote 5 Completas', preco: 139.90, creditos: { completa: 5 }, desc: 'Para quem está avaliando vários carros. Sai R$ 27,98 cada.',
      itens: ['5 consultas completas', 'Válido por 12 meses', 'Use quando quiser'], fora: [] },
    monitor: { id: 'monitor', nome: 'Monitoramento', preco: 9.90, mensal: true, creditos: {}, desc: 'Para o dono do carro ficar de olho, sem surpresa.',
      itens: ['Até 3 veículos', 'Aviso de multa nova', 'Aviso de mudança em restrição', 'Lembrete de IPVA e licenciamento', 'Cancele quando quiser'], fora: [] }
  };

  // ---------- componentes ----------
  var SIMBOLO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 350" height="58" width="166" role="img" aria-label="Placa Aberta"><defs><linearGradient id="faixa" x1="0" x2="1"><stop offset="0" stop-color="#13398A"/><stop offset="1" stop-color="#1D5FC4"/></linearGradient><linearGradient id="vel" x1="0" x2="1"><stop offset="0" stop-color="#5DB8F2" stop-opacity=".45"/><stop offset="1" stop-color="#1C8AE6"/></linearGradient><linearGradient id="ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A7DF0"/><stop offset="1" stop-color="#1557CC"/></linearGradient><clipPath id="cp"><rect x="190" y="32" width="550" height="290" rx="30"/></clipPath></defs><ellipse cx="450" cy="333" rx="300" ry="10" fill="#0E2A63" opacity=".09"/><g transform="rotate(-2 170 112)"><rect x="66" y="112" width="112" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-2 170 152)"><rect x="14" y="152" width="164" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-2 170 192)"><rect x="56" y="192" width="122" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-3.5 465 177)"><rect x="190" y="32" width="550" height="290" rx="30" fill="#fff"/><g clip-path="url(#cp)"><rect x="190" y="32" width="550" height="64" fill="url(#faixa)"/></g><rect x="190" y="32" width="550" height="290" rx="30" fill="none" stroke="#0E2A63" stroke-width="11"/><rect x="214" y="60" width="44" height="13" rx="6.5" fill="#fff"/><path d="M409.63500000000005 70.27Q409.63500000000005 72.91 407.7900000000001 74.455Q405.94500000000005 76.0 402.64500000000004 76.0H392.83500000000004V54.94H402.315Q405.52500000000003 54.94 407.34000000000003 56.41Q409.15500000000003 57.879999999999995 409.15500000000003 60.4Q409.15500000000003 62.26 408.18000000000006 63.489999999999995Q407.20500000000004 64.72 405.58500000000004 65.2Q407.415 65.59 408.52500000000003 67.015Q409.63500000000005 68.44 409.63500000000005 70.27ZM397.96500000000003 63.46H401.32500000000005Q402.58500000000004 63.46 403.26 62.905Q403.935 62.35 403.935 61.27Q403.935 60.19 403.26 59.62Q402.58500000000004 59.05 401.32500000000005 59.05H397.96500000000003ZM404.44500000000005 69.58Q404.44500000000005 68.47 403.71000000000004 67.84Q402.975 67.21000000000001 401.685 67.21000000000001H397.96500000000003V71.86H401.745Q403.035 71.86 403.74 71.275Q404.44500000000005 70.69 404.44500000000005 69.58Z M428.345 76.0 423.96500000000003 68.05H422.735V76.0H417.605V54.94H426.21500000000003Q428.705 54.94 430.46000000000004 55.81Q432.21500000000003 56.68 433.08500000000004 58.195Q433.955 59.71 433.955 61.57Q433.955 63.67 432.77 65.32Q431.585 66.97 429.275 67.66L434.135 76.0ZM422.735 64.42H425.915Q427.325 64.42 428.03 63.730000000000004Q428.735 63.04 428.735 61.78Q428.735 60.58 428.03 59.89Q427.325 59.2 425.915 59.2H422.735Z M455.275 72.28H447.415L446.15500000000003 76.0H440.785L448.40500000000003 54.94H454.345L461.96500000000003 76.0H456.535ZM453.955 68.32 451.345 60.61 448.765 68.32Z M468.675 69.7H474.13500000000005Q474.255 70.87 474.945 71.485Q475.635 72.1 476.745 72.1Q477.885 72.1 478.545 71.57499999999999Q479.20500000000004 71.05 479.20500000000004 70.12Q479.20500000000004 69.34 478.68000000000006 68.83Q478.15500000000003 68.32 477.39 67.99Q476.625 67.66 475.21500000000003 67.24Q473.175 66.61 471.885 65.97999999999999Q470.595 65.35 469.665 64.12Q468.735 62.89 468.735 60.91Q468.735 57.97 470.865 56.305Q472.995 54.64 476.415 54.64Q479.89500000000004 54.64 482.02500000000003 56.305Q484.15500000000003 57.97 484.305 60.94H478.755Q478.695 59.92 478.005 59.335Q477.315 58.75 476.235 58.75Q475.305 58.75 474.735 59.245000000000005Q474.165 59.74 474.165 60.67Q474.165 61.69 475.125 62.26Q476.08500000000004 62.83 478.125 63.49Q480.165 64.18 481.44000000000005 64.81Q482.71500000000003 65.44 483.64500000000004 66.64Q484.57500000000005 67.84 484.57500000000005 69.73Q484.57500000000005 71.53 483.66 73.0Q482.745 74.47 481.005 75.34Q479.26500000000004 76.21 476.89500000000004 76.21Q474.58500000000004 76.21 472.755 75.46Q470.925 74.71 469.83000000000004 73.24Q468.735 71.77 468.675 69.7Z M497.855 54.94V76.0H492.725V54.94Z M511.70500000000004 72.04H518.4250000000001V76.0H506.57500000000005V54.94H511.70500000000004Z" fill="#fff"/><g transform="translate(640 47)"><rect width="58" height="40.599999999999994" rx="4.64" fill="#1E9B4E"/> <path d="M29.0 4.06 L53.36 20.299999999999997 L29.0 36.54 L4.64 20.299999999999997 Z" fill="#F7D117"/> <circle cx="29.0" cy="20.299999999999997" r="9.743999999999998" fill="#1B3A8C"/></g><g transform="translate(430 196) scale(1.0788133053640994 1.24822695035461)"><path transform="translate(0.0 0)" d="M-132.95000000000002 -25.200000000000003H-143.55V0.0H-160.65000000000003V-70.2H-132.95000000000002Q-124.55000000000001 -70.2 -118.75000000000001 -67.30000000000001Q-112.95000000000002 -64.4 -110.05000000000001 -59.300000000000004Q-107.15000000000002 -54.2 -107.15000000000002 -47.6Q-107.15000000000002 -41.5 -109.95000000000002 -36.45Q-112.75000000000003 -31.400000000000002 -118.55000000000003 -28.300000000000004Q-124.35000000000002 -25.200000000000003 -132.95000000000002 -25.200000000000003ZM-124.55000000000001 -47.6Q-124.55000000000001 -51.800000000000004 -126.95000000000002 -54.10000000000001Q-129.35000000000002 -56.400000000000006 -134.25000000000003 -56.400000000000006H-143.55V-38.800000000000004H-134.25000000000003Q-129.35000000000002 -38.800000000000004 -126.95000000000002 -41.10000000000001Q-124.55000000000001 -43.400000000000006 -124.55000000000001 -47.6Z M-81.15000000000002 -13.200000000000001H-58.750000000000014V0.0H-98.25000000000001V-70.2H-81.15000000000002Z M-6.8500000000000085 -12.4H-33.05000000000001L-37.250000000000014 0.0H-55.15000000000001L-29.750000000000014 -70.2H-9.95000000000001L15.449999999999989 0.0H-2.650000000000013ZM-11.250000000000014 -25.6 -19.95000000000001 -51.300000000000004 -28.55000000000001 -25.6Z M55.54999999999999 -71.0Q68.04999999999998 -71.0 76.94999999999999 -64.4Q85.85 -57.800000000000004 88.85 -46.400000000000006H70.04999999999998Q67.94999999999999 -50.800000000000004 64.1 -53.10000000000001Q60.24999999999999 -55.400000000000006 55.349999999999994 -55.400000000000006Q47.44999999999999 -55.400000000000006 42.54999999999999 -49.900000000000006Q37.64999999999999 -44.400000000000006 37.64999999999999 -35.2Q37.64999999999999 -26.0 42.54999999999999 -20.5Q47.44999999999999 -15.0 55.349999999999994 -15.0Q60.24999999999999 -15.0 64.1 -17.3Q67.94999999999999 -19.6 70.04999999999998 -24.0H88.85Q85.85 -12.600000000000001 76.94999999999999 -6.050000000000001Q68.04999999999998 0.5 55.54999999999999 0.5Q45.349999999999994 0.5 37.29999999999999 -4.05Q29.24999999999999 -8.6 24.74999999999999 -16.7Q20.24999999999999 -24.8 20.24999999999999 -35.2Q20.24999999999999 -45.6 24.74999999999999 -53.75Q29.24999999999999 -61.900000000000006 37.29999999999999 -66.45Q45.349999999999994 -71.0 55.54999999999999 -71.0Z M143.04999999999998 -12.4H116.84999999999998L112.64999999999998 0.0H94.74999999999997L120.14999999999998 -70.2H139.95L165.34999999999997 0.0H147.24999999999997ZM138.64999999999998 -25.6 129.95 -51.300000000000004 121.34999999999998 -25.6Z" fill="#0E2A63" stroke="#0E2A63" stroke-width="3.4378434065934065" stroke-linejoin="round"/></g><g transform="translate(448 294) scale(1.0926729640030635 1.24822695035461)"><path transform="translate(0.0 0)" d="M-145.95000000000002 -12.4H-172.15000000000003L-176.35000000000002 0.0H-194.25000000000003L-168.85000000000002 -70.2H-149.05L-123.65000000000002 0.0H-141.75000000000003ZM-150.35000000000002 -25.6 -159.05 -51.300000000000004 -167.65000000000003 -25.6Z M-59.95000000000002 -19.1Q-59.95000000000002 -10.3 -66.10000000000002 -5.15Q-72.25000000000001 0.0 -83.25000000000001 0.0H-115.95000000000002V-70.2H-84.35000000000002Q-73.65000000000002 -70.2 -67.60000000000002 -65.30000000000001Q-61.55000000000002 -60.400000000000006 -61.55000000000002 -52.0Q-61.55000000000002 -45.800000000000004 -64.80000000000001 -41.7Q-68.05000000000001 -37.6 -73.45000000000002 -36.0Q-67.35000000000002 -34.7 -63.65000000000002 -29.950000000000003Q-59.95000000000002 -25.200000000000003 -59.95000000000002 -19.1ZM-98.85000000000002 -41.800000000000004H-87.65000000000002Q-83.45000000000002 -41.800000000000004 -81.20000000000002 -43.650000000000006Q-78.95000000000002 -45.5 -78.95000000000002 -49.1Q-78.95000000000002 -52.7 -81.20000000000002 -54.6Q-83.45000000000002 -56.5 -87.65000000000002 -56.5H-98.85000000000002ZM-77.25000000000001 -21.400000000000002Q-77.25000000000001 -25.1 -79.70000000000002 -27.200000000000003Q-82.15000000000002 -29.3 -86.45000000000002 -29.3H-98.85000000000002V-13.8H-86.25000000000003Q-81.95000000000002 -13.8 -79.60000000000002 -15.75Q-77.25000000000001 -17.7 -77.25000000000001 -21.400000000000002Z M-32.95000000000003 -56.5V-42.300000000000004H-10.050000000000026V-29.1H-32.95000000000003V-13.700000000000001H-7.050000000000026V0.0H-50.050000000000026V-70.2H-7.050000000000026V-56.5Z M39.849999999999994 0.0 25.249999999999996 -26.5H21.149999999999995V0.0H4.0499999999999945V-70.2H32.74999999999999Q41.05 -70.2 46.9 -67.30000000000001Q52.75 -64.4 55.65 -59.35000000000001Q58.55 -54.300000000000004 58.55 -48.1Q58.55 -41.1 54.599999999999994 -35.6Q50.65 -30.1 42.949999999999996 -27.8L59.15 0.0ZM21.149999999999995 -38.6H31.749999999999993Q36.449999999999996 -38.6 38.8 -40.900000000000006Q41.15 -43.2 41.15 -47.400000000000006Q41.15 -51.400000000000006 38.8 -53.7Q36.449999999999996 -56.0 31.749999999999993 -56.0H21.149999999999995Z M119.75000000000001 -70.2V-56.5H101.15V0.0H84.05000000000001V-56.5H65.45000000000002V-70.2Z M172.04999999999998 -12.4H145.84999999999997L141.64999999999998 0.0H123.74999999999997L149.14999999999998 -70.2H168.95L194.34999999999997 0.0H176.24999999999997ZM167.64999999999998 -25.6 158.95 -51.300000000000004 150.34999999999997 -25.6Z" fill="url(#ab)" stroke="url(#ab)" stroke-width="3.4174891249868513" stroke-linejoin="round"/></g></g><line x1="868" y1="252" x2="952" y2="336" stroke="#0E2A63" stroke-width="30" stroke-linecap="round"/><circle cx="792" cy="176" r="96" fill="#fff" stroke="#0E2A63" stroke-width="22"/><g transform="translate(792 174) scale(1.38)"> <path d="M-38 -6 L-28 -32 Q-25 -38 -17 -38 H17 Q25 -38 28 -32 L38 -6 Z" fill="#0E2A63"/> <path d="M-29 -9 L-21 -29 Q-19 -32 -15 -32 H15 Q19 -32 21 -29 L29 -9 Z" fill="#fff"/> <path d="M-50 -2 Q-50 -10 -42 -10 H42 Q50 -10 50 -2 V22 Q50 28 44 28 H-44 Q-50 28 -50 22 Z" fill="#0E2A63"/> <rect x="-56" y="-14" width="12" height="7" rx="3.5" fill="#0E2A63"/><rect x="44" y="-14" width="12" height="7" rx="3.5" fill="#0E2A63"/> <path d="M-44 2 L-24 6 L-27 12 L-44 9 Z" fill="#fff"/><path d="M44 2 L24 6 L27 12 L44 9 Z" fill="#fff"/> <rect x="-14" y="10" width="28" height="6" rx="3" fill="#fff"/> <rect x="-44" y="26" width="18" height="16" rx="4" fill="#0E2A63"/><rect x="26" y="26" width="18" height="16" rx="4" fill="#0E2A63"/></g></svg>';
  var ILUSTRA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 350" class="ilustra" role="img" aria-label="Logo Placa Aberta"><defs><linearGradient id="faixa" x1="0" x2="1"><stop offset="0" stop-color="#13398A"/><stop offset="1" stop-color="#1D5FC4"/></linearGradient><linearGradient id="vel" x1="0" x2="1"><stop offset="0" stop-color="#5DB8F2" stop-opacity=".45"/><stop offset="1" stop-color="#1C8AE6"/></linearGradient><linearGradient id="ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A7DF0"/><stop offset="1" stop-color="#1557CC"/></linearGradient><clipPath id="cp"><rect x="190" y="32" width="550" height="290" rx="30"/></clipPath></defs><ellipse cx="450" cy="333" rx="300" ry="10" fill="#0E2A63" opacity=".09"/><g transform="rotate(-2 170 112)"><rect x="66" y="112" width="112" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-2 170 152)"><rect x="14" y="152" width="164" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-2 170 192)"><rect x="56" y="192" width="122" height="15" rx="7.5" fill="url(#vel)"/></g><g transform="rotate(-3.5 465 177)"><rect x="190" y="32" width="550" height="290" rx="30" fill="#fff"/><g clip-path="url(#cp)"><rect x="190" y="32" width="550" height="64" fill="url(#faixa)"/></g><rect x="190" y="32" width="550" height="290" rx="30" fill="none" stroke="#0E2A63" stroke-width="11"/><rect x="214" y="60" width="44" height="13" rx="6.5" fill="#fff"/><path d="M409.63500000000005 70.27Q409.63500000000005 72.91 407.7900000000001 74.455Q405.94500000000005 76.0 402.64500000000004 76.0H392.83500000000004V54.94H402.315Q405.52500000000003 54.94 407.34000000000003 56.41Q409.15500000000003 57.879999999999995 409.15500000000003 60.4Q409.15500000000003 62.26 408.18000000000006 63.489999999999995Q407.20500000000004 64.72 405.58500000000004 65.2Q407.415 65.59 408.52500000000003 67.015Q409.63500000000005 68.44 409.63500000000005 70.27ZM397.96500000000003 63.46H401.32500000000005Q402.58500000000004 63.46 403.26 62.905Q403.935 62.35 403.935 61.27Q403.935 60.19 403.26 59.62Q402.58500000000004 59.05 401.32500000000005 59.05H397.96500000000003ZM404.44500000000005 69.58Q404.44500000000005 68.47 403.71000000000004 67.84Q402.975 67.21000000000001 401.685 67.21000000000001H397.96500000000003V71.86H401.745Q403.035 71.86 403.74 71.275Q404.44500000000005 70.69 404.44500000000005 69.58Z M428.345 76.0 423.96500000000003 68.05H422.735V76.0H417.605V54.94H426.21500000000003Q428.705 54.94 430.46000000000004 55.81Q432.21500000000003 56.68 433.08500000000004 58.195Q433.955 59.71 433.955 61.57Q433.955 63.67 432.77 65.32Q431.585 66.97 429.275 67.66L434.135 76.0ZM422.735 64.42H425.915Q427.325 64.42 428.03 63.730000000000004Q428.735 63.04 428.735 61.78Q428.735 60.58 428.03 59.89Q427.325 59.2 425.915 59.2H422.735Z M455.275 72.28H447.415L446.15500000000003 76.0H440.785L448.40500000000003 54.94H454.345L461.96500000000003 76.0H456.535ZM453.955 68.32 451.345 60.61 448.765 68.32Z M468.675 69.7H474.13500000000005Q474.255 70.87 474.945 71.485Q475.635 72.1 476.745 72.1Q477.885 72.1 478.545 71.57499999999999Q479.20500000000004 71.05 479.20500000000004 70.12Q479.20500000000004 69.34 478.68000000000006 68.83Q478.15500000000003 68.32 477.39 67.99Q476.625 67.66 475.21500000000003 67.24Q473.175 66.61 471.885 65.97999999999999Q470.595 65.35 469.665 64.12Q468.735 62.89 468.735 60.91Q468.735 57.97 470.865 56.305Q472.995 54.64 476.415 54.64Q479.89500000000004 54.64 482.02500000000003 56.305Q484.15500000000003 57.97 484.305 60.94H478.755Q478.695 59.92 478.005 59.335Q477.315 58.75 476.235 58.75Q475.305 58.75 474.735 59.245000000000005Q474.165 59.74 474.165 60.67Q474.165 61.69 475.125 62.26Q476.08500000000004 62.83 478.125 63.49Q480.165 64.18 481.44000000000005 64.81Q482.71500000000003 65.44 483.64500000000004 66.64Q484.57500000000005 67.84 484.57500000000005 69.73Q484.57500000000005 71.53 483.66 73.0Q482.745 74.47 481.005 75.34Q479.26500000000004 76.21 476.89500000000004 76.21Q474.58500000000004 76.21 472.755 75.46Q470.925 74.71 469.83000000000004 73.24Q468.735 71.77 468.675 69.7Z M497.855 54.94V76.0H492.725V54.94Z M511.70500000000004 72.04H518.4250000000001V76.0H506.57500000000005V54.94H511.70500000000004Z" fill="#fff"/><g transform="translate(640 47)"><rect width="58" height="40.599999999999994" rx="4.64" fill="#1E9B4E"/> <path d="M29.0 4.06 L53.36 20.299999999999997 L29.0 36.54 L4.64 20.299999999999997 Z" fill="#F7D117"/> <circle cx="29.0" cy="20.299999999999997" r="9.743999999999998" fill="#1B3A8C"/></g><g transform="translate(430 196) scale(1.0788133053640994 1.24822695035461)"><path transform="translate(0.0 0)" d="M-132.95000000000002 -25.200000000000003H-143.55V0.0H-160.65000000000003V-70.2H-132.95000000000002Q-124.55000000000001 -70.2 -118.75000000000001 -67.30000000000001Q-112.95000000000002 -64.4 -110.05000000000001 -59.300000000000004Q-107.15000000000002 -54.2 -107.15000000000002 -47.6Q-107.15000000000002 -41.5 -109.95000000000002 -36.45Q-112.75000000000003 -31.400000000000002 -118.55000000000003 -28.300000000000004Q-124.35000000000002 -25.200000000000003 -132.95000000000002 -25.200000000000003ZM-124.55000000000001 -47.6Q-124.55000000000001 -51.800000000000004 -126.95000000000002 -54.10000000000001Q-129.35000000000002 -56.400000000000006 -134.25000000000003 -56.400000000000006H-143.55V-38.800000000000004H-134.25000000000003Q-129.35000000000002 -38.800000000000004 -126.95000000000002 -41.10000000000001Q-124.55000000000001 -43.400000000000006 -124.55000000000001 -47.6Z M-81.15000000000002 -13.200000000000001H-58.750000000000014V0.0H-98.25000000000001V-70.2H-81.15000000000002Z M-6.8500000000000085 -12.4H-33.05000000000001L-37.250000000000014 0.0H-55.15000000000001L-29.750000000000014 -70.2H-9.95000000000001L15.449999999999989 0.0H-2.650000000000013ZM-11.250000000000014 -25.6 -19.95000000000001 -51.300000000000004 -28.55000000000001 -25.6Z M55.54999999999999 -71.0Q68.04999999999998 -71.0 76.94999999999999 -64.4Q85.85 -57.800000000000004 88.85 -46.400000000000006H70.04999999999998Q67.94999999999999 -50.800000000000004 64.1 -53.10000000000001Q60.24999999999999 -55.400000000000006 55.349999999999994 -55.400000000000006Q47.44999999999999 -55.400000000000006 42.54999999999999 -49.900000000000006Q37.64999999999999 -44.400000000000006 37.64999999999999 -35.2Q37.64999999999999 -26.0 42.54999999999999 -20.5Q47.44999999999999 -15.0 55.349999999999994 -15.0Q60.24999999999999 -15.0 64.1 -17.3Q67.94999999999999 -19.6 70.04999999999998 -24.0H88.85Q85.85 -12.600000000000001 76.94999999999999 -6.050000000000001Q68.04999999999998 0.5 55.54999999999999 0.5Q45.349999999999994 0.5 37.29999999999999 -4.05Q29.24999999999999 -8.6 24.74999999999999 -16.7Q20.24999999999999 -24.8 20.24999999999999 -35.2Q20.24999999999999 -45.6 24.74999999999999 -53.75Q29.24999999999999 -61.900000000000006 37.29999999999999 -66.45Q45.349999999999994 -71.0 55.54999999999999 -71.0Z M143.04999999999998 -12.4H116.84999999999998L112.64999999999998 0.0H94.74999999999997L120.14999999999998 -70.2H139.95L165.34999999999997 0.0H147.24999999999997ZM138.64999999999998 -25.6 129.95 -51.300000000000004 121.34999999999998 -25.6Z" fill="#0E2A63" stroke="#0E2A63" stroke-width="3.4378434065934065" stroke-linejoin="round"/></g><g transform="translate(448 294) scale(1.0926729640030635 1.24822695035461)"><path transform="translate(0.0 0)" d="M-145.95000000000002 -12.4H-172.15000000000003L-176.35000000000002 0.0H-194.25000000000003L-168.85000000000002 -70.2H-149.05L-123.65000000000002 0.0H-141.75000000000003ZM-150.35000000000002 -25.6 -159.05 -51.300000000000004 -167.65000000000003 -25.6Z M-59.95000000000002 -19.1Q-59.95000000000002 -10.3 -66.10000000000002 -5.15Q-72.25000000000001 0.0 -83.25000000000001 0.0H-115.95000000000002V-70.2H-84.35000000000002Q-73.65000000000002 -70.2 -67.60000000000002 -65.30000000000001Q-61.55000000000002 -60.400000000000006 -61.55000000000002 -52.0Q-61.55000000000002 -45.800000000000004 -64.80000000000001 -41.7Q-68.05000000000001 -37.6 -73.45000000000002 -36.0Q-67.35000000000002 -34.7 -63.65000000000002 -29.950000000000003Q-59.95000000000002 -25.200000000000003 -59.95000000000002 -19.1ZM-98.85000000000002 -41.800000000000004H-87.65000000000002Q-83.45000000000002 -41.800000000000004 -81.20000000000002 -43.650000000000006Q-78.95000000000002 -45.5 -78.95000000000002 -49.1Q-78.95000000000002 -52.7 -81.20000000000002 -54.6Q-83.45000000000002 -56.5 -87.65000000000002 -56.5H-98.85000000000002ZM-77.25000000000001 -21.400000000000002Q-77.25000000000001 -25.1 -79.70000000000002 -27.200000000000003Q-82.15000000000002 -29.3 -86.45000000000002 -29.3H-98.85000000000002V-13.8H-86.25000000000003Q-81.95000000000002 -13.8 -79.60000000000002 -15.75Q-77.25000000000001 -17.7 -77.25000000000001 -21.400000000000002Z M-32.95000000000003 -56.5V-42.300000000000004H-10.050000000000026V-29.1H-32.95000000000003V-13.700000000000001H-7.050000000000026V0.0H-50.050000000000026V-70.2H-7.050000000000026V-56.5Z M39.849999999999994 0.0 25.249999999999996 -26.5H21.149999999999995V0.0H4.0499999999999945V-70.2H32.74999999999999Q41.05 -70.2 46.9 -67.30000000000001Q52.75 -64.4 55.65 -59.35000000000001Q58.55 -54.300000000000004 58.55 -48.1Q58.55 -41.1 54.599999999999994 -35.6Q50.65 -30.1 42.949999999999996 -27.8L59.15 0.0ZM21.149999999999995 -38.6H31.749999999999993Q36.449999999999996 -38.6 38.8 -40.900000000000006Q41.15 -43.2 41.15 -47.400000000000006Q41.15 -51.400000000000006 38.8 -53.7Q36.449999999999996 -56.0 31.749999999999993 -56.0H21.149999999999995Z M119.75000000000001 -70.2V-56.5H101.15V0.0H84.05000000000001V-56.5H65.45000000000002V-70.2Z M172.04999999999998 -12.4H145.84999999999997L141.64999999999998 0.0H123.74999999999997L149.14999999999998 -70.2H168.95L194.34999999999997 0.0H176.24999999999997ZM167.64999999999998 -25.6 158.95 -51.300000000000004 150.34999999999997 -25.6Z" fill="url(#ab)" stroke="url(#ab)" stroke-width="3.4174891249868513" stroke-linejoin="round"/></g></g><line x1="868" y1="252" x2="952" y2="336" stroke="#0E2A63" stroke-width="30" stroke-linecap="round"/><circle cx="792" cy="176" r="96" fill="#fff" stroke="#0E2A63" stroke-width="22"/><g transform="translate(792 174) scale(1.38)"> <path d="M-38 -6 L-28 -32 Q-25 -38 -17 -38 H17 Q25 -38 28 -32 L38 -6 Z" fill="#0E2A63"/> <path d="M-29 -9 L-21 -29 Q-19 -32 -15 -32 H15 Q19 -32 21 -29 L29 -9 Z" fill="#fff"/> <path d="M-50 -2 Q-50 -10 -42 -10 H42 Q50 -10 50 -2 V22 Q50 28 44 28 H-44 Q-50 28 -50 22 Z" fill="#0E2A63"/> <rect x="-56" y="-14" width="12" height="7" rx="3.5" fill="#0E2A63"/><rect x="44" y="-14" width="12" height="7" rx="3.5" fill="#0E2A63"/> <path d="M-44 2 L-24 6 L-27 12 L-44 9 Z" fill="#fff"/><path d="M44 2 L24 6 L27 12 L44 9 Z" fill="#fff"/> <rect x="-14" y="10" width="28" height="6" rx="3" fill="#fff"/> <rect x="-44" y="26" width="18" height="16" rx="4" fill="#0E2A63"/><rect x="26" y="26" width="18" height="16" rx="4" fill="#0E2A63"/></g></svg>';
  var CADEADO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E6BE0" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function placaHTML(p, peq) { return '<div class="placa' + (peq ? ' p' : '') + '"><div class="faixa"><span>BRASIL</span><i></i></div><div class="chars">' + esc(fmt(p)) + '</div></div>'; }
  function formBusca(valor, id, ph) {
    id = id || 'busca';
    return '<form class="busca" data-busca="' + id + '"><input name="placa" maxlength="8" autocomplete="off" spellcheck="false" placeholder="' + (ph || 'ABC1D23') + '" value="' + esc(valor || '') + '" aria-label="Placa do veículo"><button class="btn btn-pri" type="submit">Consultar grátis</button></form><div class="busca-erro" id="' + id + '-erro"></div>';
  }
  function anel(v) {
    var c = 2 * Math.PI * 56; var o = c * (1 - v / 100);
    return '<div class="anel"><svg width="132" height="132"><circle cx="66" cy="66" r="56" stroke="#E2E8F2" stroke-width="10" fill="none"/><circle cx="66" cy="66" r="56" stroke="' + corIndice(v) + '" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + o + '"/></svg><div class="v"><div><b>' + v + '</b><small>de 100</small></div></div></div>';
  }
  function pil(txt, tipo) { return '<span class="pilula ' + (tipo || '') + '"><span class="ponto"></span>' + esc(txt) + '</span>'; }

  // ---------- topo ----------
  function topo() {
    var rota = location.hash;
    var u = E.usuario;
    var h = '<a class="logo" href="#/">' + SIMBOLO + '</a><nav class="nav">' +
      '<a class="lk' + (rota.indexOf('#/planos') === 0 ? ' ativo' : '') + '" href="#/planos">Planos</a>' +
      '<a class="lk" href="#/como-funciona">Como funciona</a>';
    if (u) {
      h += '<span class="creditos">' + totalCreditos() + ' créditos</span>' +
        '<div class="menu-wrap"><button class="avatar" id="btn-menu" aria-label="Menu da conta">' + esc(u.nome.charAt(0).toUpperCase()) + '</button>' +
        '<div class="menu" id="menu"><div class="quem"><b>' + esc(u.nome) + '</b><small>' + esc(u.email) + '</small></div>' +
        '<a href="#/conta">Minha conta</a><a href="#/conta/consultas">Minhas consultas</a><a href="#/conta/monitorados">Veículos monitorados</a><a href="#/configuracoes">Configurações</a><button id="btn-sair">Sair</button></div></div>';
    } else {
      h += '<a class="lk" href="#/entrar">Entrar</a><a class="btn btn-pri" style="padding:9px 16px" href="#/cadastro">Criar conta</a>';
    }
    $('#topo').innerHTML = h + '</nav>';
    var bm = $('#btn-menu');
    if (bm) bm.onclick = function (e) { e.stopPropagation(); $('#menu').classList.toggle('aberto'); };
    var bs = $('#btn-sair');
    if (bs) bs.onclick = function () { E.usuario = null; salvar(); toast('Você saiu da sua conta.'); ir('#/'); };
  }
  document.addEventListener('click', function () { var m = $('#menu'); if (m) m.classList.remove('aberto'); });

  // ---------- páginas ----------
  function pHome() {
    return '<section class="hero"><div>' +
      '<span class="pilula ok"><span class="ponto"></span>Consulta inicial grátis</span>' +
      '<h1>Digite a placa. <em>Veja tudo</em> sobre o veículo.</h1>' +
      '<p class="sub" style="max-width:46ch;margin-bottom:26px">Situação, multas, débitos, restrições, leilão e histórico em uma ficha clara. Para comprar, vender ou cuidar do seu carro sem surpresa.</p>' +
      formBusca('', 'busca-home') +
      '<p class="tiny" style="margin-top:6px">Aceita placa Mercosul (ABC1D23) e antiga (ABC-1234). No app, a placa é lida pela câmera.</p>' +
      '</div><div class="cena" aria-hidden="true"><i class="canto c1"></i><i class="canto c2"></i><i class="canto c3"></i><i class="canto c4"></i>' + placaHTML('RTA4C21') + '<div class="scan"></div><div class="leitura">lendo placa <b>RTA4C21</b></div></div></section>' +

      '<section class="sec" id="como-funciona"><div class="sec-tit"><h2>Como funciona</h2></div><div class="grade3">' +
      '<div class="card passo"><span class="n">01</span><div><b>Digite ou aponte a câmera</b><p>No site você digita a placa. No app, é só apontar a câmera.</p></div></div>' +
      '<div class="card passo"><span class="n">02</span><div><b>Veja a prévia grátis</b><p>Marca, modelo, ano, cor e combustível aparecem na hora, sem cadastro.</p></div></div>' +
      '<div class="card passo"><span class="n">03</span><div><b>Desbloqueie a ficha</b><p>Escolha a Básica ou a Completa e pague com Pix. A ficha abre em segundos.</p></div></div></div></section>' +

      '<section class="sec"><div class="sec-tit"><h2>O que a ficha mostra</h2><a class="btn btn-sec" href="#/planos">Ver planos</a></div><div class="grade4">' +
      ['Multas por órgão|Municipais, estaduais e de outros estados, com valor e situação', 'Débitos|IPVA e licenciamento em aberto', 'Restrições|Judicial, administrativa, roubo e furto', 'Gravame|Se o carro ainda está financiado', 'Leilão e sinistro|Passagem por leilão e perda total', 'Recall|Chamados do fabricante pendentes', 'Histórico|Municípios onde o carro já foi registrado', 'Índice Placa Aberta|Uma nota de 0 a 100 que resume tudo']
        .map(function (x) { var p = x.split('|'); return '<div class="card"><h3 style="font-size:16px;margin-bottom:6px">' + p[0] + '</h3><p class="muted" style="font-size:14px">' + p[1] + '</p></div>'; }).join('') +
      '</div></section>' +

      '<section class="sec"><div class="card destaque" style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;padding:30px">' +
      '<div><h2 style="font-size:26px">Monitore o seu carro</h2><p class="muted" style="margin-top:6px;max-width:52ch">Receba um aviso quando aparecer multa nova, mudar alguma restrição ou chegar a época do IPVA. Por ' + moeda(9.90) + ' por mês.</p></div>' +
      '<a class="btn btn-pri" href="#/planos">Quero monitorar</a></div></section>';
  }

  function pComoFunciona() { setTimeout(function () { var s = $('#como-funciona'); if (s) s.scrollIntoView(); }, 30); return pHome(); }

  function pResultado(placa) {
    if (!valida(placa)) return pNaoEncontrado('Essa placa não parece válida.');
    var v = veiculo(placa);
    if (E.desbloqueadas[placa]) { ir('#/relatorio/' + placa); return ''; }
    var abertas = v.multas.filter(function (m) { return m.aberta; }).length;
    var temCredito = E.usuario && totalCreditos() > 0;
    var falsas = '<div class="grade2">' +
      '<div class="card"><h3>Situação e licenciamento</h3>' + kv('Situação', 'Em circulação') + kv('Licenciamento 2026', 'Pago') + kv('IPVA 2026', moeda(2340)) + kv('Restrições', 'Nada consta') + '</div>' +
      '<div class="card"><h3>Multas</h3>' + kv('Em aberto', '2 multas') + kv('Valor total', moeda(488.70)) + kv('Órgão', 'Municipal') + kv('Pontos', '12') + '</div>' +
      '<div class="card"><h3>Gravame e leilão</h3>' + kv('Gravame', 'Alienação fiduciária') + kv('Financeira', 'Banco Exemplo S.A.') + kv('Leilão', 'Nada consta') + kv('Sinistro', 'Nada consta') + '</div>' +
      '<div class="card"><h3>Histórico</h3>' + kv('Proprietários', '3') + kv('Primeiro registro', 'Campinas, SP') + kv('Último registro', 'São Paulo, SP') + kv('Recall', '1 pendente') + '</div></div>';
    var cta = temCredito
      ? '<button class="btn btn-pri btn-bloco" data-usar="' + placa + '">Usar 1 crédito e abrir a ficha</button><p class="tiny" style="margin-top:10px">Você tem ' + totalCreditos() + ' crédito(s).</p>'
      : '<a class="btn btn-pri btn-bloco" href="#/planos?placa=' + placa + '">Desbloquear a ficha a partir de ' + moeda(19.90) + '</a><p class="tiny" style="margin-top:10px">Pagamento por Pix. A ficha abre na hora.</p>';
    return '<a class="voltar" href="#/">Voltar</a>' +
      '<div class="res-topo">' + placaHTML(placa) + '<div><span class="pilula ok"><span class="ponto"></span>Prévia gratuita</span><h1 style="font-size:clamp(26px,3.6vw,38px);margin-top:10px">' + esc(v.marca + ' ' + v.modelo) + '</h1><p class="muted">Registrado em ' + esc(v.municipio) + '</p></div>' +
      '<div class="no-print">' + formBusca('', 'busca-res', 'OUTRA PLACA').replace('Consultar grátis', 'Consultar') + '</div></div>' +
      '<div class="dados-livres">' + dado('Marca', v.marca) + dado('Modelo', v.modelo.split(' ')[0]) + dado('Ano', v.ano) + dado('Combustível', v.combustivel) + dado('Cor', v.cor) + '</div>' +
      '<div class="card" style="margin-top:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
      '<b style="font-weight:500">Encontramos informações sobre este veículo.</b>' + pil(abertas ? 'Constam multas' : 'Multas verificadas', abertas ? 'atencao' : '') + pil(v.gravame ? 'Consta gravame' : 'Gravame verificado', v.gravame ? 'atencao' : '') + pil('Débitos verificados') + '</div>' +
      '<div class="bloqueado"><div class="borrado" aria-hidden="true">' + falsas + '</div><div class="trava"><div class="card"><div class="cadeado">' + CADEADO + '</div>' +
      '<h3 style="margin-bottom:8px">O restante da ficha está bloqueado</h3><p class="muted" style="font-size:14.5px;margin-bottom:18px">Multas com valores, débitos, restrições, gravame, leilão, sinistro e histórico do veículo.</p>' + cta + '</div></div></div>';
  }
  function dado(k, v) { return '<div class="dado"><small>' + k + '</small><b>' + esc(v) + '</b></div>'; }
  function kv(k, v) { return '<div class="linha-kv"><span>' + k + '</span><span>' + v + '</span></div>'; }

  function pPlanos(params) {
    var placa = params.placa || '';
    var cards = ['basica', 'completa', 'pacote', 'monitor'].map(function (id) {
      var p = PLANOS[id];
      return '<div class="card plano' + (p.destaque ? ' destaque' : '') + '">' + (p.destaque ? '<span class="selo-plano">Mais escolhida</span>' : '') +
        '<div><h3>' + p.nome + '</h3><p class="muted" style="font-size:14px;margin-top:4px">' + p.desc + '</p></div>' +
        '<div class="preco">' + moeda(p.preco) + (p.mensal ? ' <small>por mês</small>' : '') + '</div>' +
        '<ul>' + p.itens.map(function (i) { return '<li>' + i + '</li>'; }).join('') + p.fora.map(function (i) { return '<li class="nao">' + i + '</li>'; }).join('') + '</ul>' +
        '<button class="btn ' + (p.destaque ? 'btn-pri' : 'btn-sec') + ' btn-bloco" data-plano="' + id + '">' + (id === 'monitor' ? (E.assinatura ? 'Você já assina' : 'Assinar') : 'Escolher') + '</button></div>';
    }).join('');
    return (placa ? '<a class="voltar" href="#/consulta/' + placa + '">Voltar para a placa ' + esc(fmt(placa)) + '</a>' : '') +
      '<div class="sec-tit"><div><h1 style="font-size:clamp(30px,4vw,44px)">Escolha como consultar</h1><p class="sub" style="margin-top:8px">Sem mensalidade nas consultas. Você paga só pelo que usar.</p></div>' + (placa ? placaHTML(placa, true) : '') + '</div>' +
      '<div class="grade4" style="margin-top:28px">' + cards + '</div>' +
      '<p class="tiny" style="margin-top:22px">Créditos valem por 12 meses. A consulta Completa também abre tudo o que a Básica mostra.</p>';
  }

  function pEntrar(params) {
    var volta = params.voltar || '#/conta';
    return '<div class="auth"><h1>Entrar</h1><p class="muted" style="margin-bottom:24px">Acesse suas consultas e créditos.</p>' +
      '<button class="btn btn-sec btn-bloco" data-google>Continuar com Google</button><div class="divisor">ou com e-mail</div>' +
      '<form id="f-entrar" novalidate data-volta="' + esc(volta) + '">' +
      campo('email', 'E-mail', 'email', 'voce@email.com', 'Informe um e-mail válido.') +
      campo('senha', 'Senha', 'password', 'Sua senha', 'Informe a senha.') +
      '<div style="text-align:right;margin:-6px 0 18px"><a class="tiny verde" href="#/esqueci">Esqueci minha senha</a></div>' +
      '<button class="btn btn-pri btn-bloco" type="submit">Entrar</button></form>' +
      '<p class="muted centro" style="margin-top:22px;font-size:14px">Ainda não tem conta? <a class="verde" href="#/cadastro?voltar=' + encodeURIComponent(volta) + '">Criar conta</a></p></div>';
  }
  function campo(nome, rotulo, tipo, ph, erro, valor, extra) {
    return '<div class="campo"><label for="c-' + nome + '">' + rotulo + '</label><input id="c-' + nome + '" name="' + nome + '" type="' + tipo + '" placeholder="' + esc(ph || '') + '" value="' + esc(valor || '') + '"' + (extra || '') + '><span class="erro">' + (erro || '') + '</span></div>';
  }
  function pCadastro(params) {
    var volta = params.voltar || '#/conta';
    return '<div class="auth"><h1>Criar conta</h1><p class="muted" style="margin-bottom:24px">Leva menos de um minuto.</p>' +
      '<button class="btn btn-sec btn-bloco" data-google>Continuar com Google</button><div class="divisor">ou com e-mail</div>' +
      '<form id="f-cadastro" novalidate data-volta="' + esc(volta) + '">' +
      campo('nome', 'Nome', 'text', 'Como podemos te chamar', 'Informe seu nome.') +
      campo('email', 'E-mail', 'email', 'voce@email.com', 'Informe um e-mail válido.') +
      campo('celular', 'Celular com DDD', 'tel', '(11) 90000-0000', 'Informe um celular válido. Enviaremos um código por SMS.') +
      campo('senha', 'Senha', 'password', 'Mínimo de 8 caracteres', 'A senha precisa ter pelo menos 8 caracteres.') +
      '<label class="check"><input type="checkbox" name="termos"><span>Li e aceito os <a href="#/termos">Termos de uso</a> e a <a href="#/privacidade">Política de privacidade</a>.</span></label>' +
      '<button class="btn btn-pri btn-bloco" type="submit">Criar conta</button></form>' +
      '<p class="muted centro" style="margin-top:22px;font-size:14px">Já tem conta? <a class="verde" href="#/entrar?voltar=' + encodeURIComponent(volta) + '">Entrar</a></p></div>';
  }
  function pCodigo(params) {
    return '<div class="auth centro"><h1>Confirme seu celular</h1><p class="muted" style="margin-bottom:24px">Enviamos um código de 6 dígitos por SMS para ' + esc(E.usuario ? E.usuario.celular : '') + '. Neste protótipo, use qualquer número.</p>' +
      '<form id="f-codigo" data-volta="' + esc(params.voltar || '#/conta') + '">' + campo('codigo', 'Código', 'text', '000000', 'Digite os 6 dígitos.', '', ' inputmode="numeric" maxlength="6" style="text-align:center;letter-spacing:.4em;font-family:JetBrains Mono,monospace;font-size:22px"') +
      '<button class="btn btn-pri btn-bloco" type="submit">Confirmar</button></form><p class="tiny" style="margin-top:16px">Não recebeu? <a class="verde" href="javascript:void 0" data-reenviar>Reenviar código</a></p></div>';
  }
  function pEsqueci() {
    return '<div class="auth"><a class="voltar" href="#/entrar">Voltar</a><h1>Recuperar senha</h1><p class="muted" style="margin-bottom:24px">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>' +
      '<form id="f-esqueci" novalidate>' + campo('email', 'E-mail', 'email', 'voce@email.com', 'Informe um e-mail válido.') + '<button class="btn btn-pri btn-bloco" type="submit">Enviar link</button></form></div>';
  }

  function pCheckout() {
    if (!E.usuario) { ir('#/entrar?voltar=' + encodeURIComponent('#/checkout')); return ''; }
    var c = E.carrinho; if (!c) { ir('#/planos'); return ''; }
    var p = PLANOS[c.plano];
    return '<a class="voltar" href="#/planos' + (c.placa ? '?placa=' + c.placa : '') + '">Trocar plano</a><h1 style="font-size:clamp(28px,3.6vw,40px);margin-bottom:24px">Pagamento</h1>' +
      '<div class="checkout"><div class="card"><div class="abas" role="tablist"><button class="ativo" data-aba="pix">Pix</button><button data-aba="cartao">Cartão</button></div><div id="pagto">' + abaPix() + '</div></div>' +
      '<div class="card resumo"><h3 style="margin-bottom:12px">Resumo</h3>' +
      (c.placa ? '<div style="margin-bottom:14px">' + placaHTML(c.placa, true) + '</div>' : '') +
      kv(p.nome, moeda(p.preco)) + kv('Desconto', moeda(0)) + kv('Total', '<b>' + moeda(p.preco) + (p.mensal ? '/mês' : '') + '</b>') +
      '<p class="tiny" style="margin-top:14px">A nota fiscal é enviada para ' + esc(E.usuario.email) + '. Pagamento processado por um parceiro certificado.</p></div></div>';
  }
  function qrFalso(seed) {
    var r = rng(hash(seed)); var n = 25; var s = '<svg viewBox="0 0 ' + n + ' ' + n + '" width="176" height="176" shape-rendering="crispEdges">';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var canto = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
      var on = canto ? ((x % 6 === 0 || y % 6 === 0 || (x % 6 > 1 && x % 6 < 5 && y % 6 > 1 && y % 6 < 5)) && !(x === 6 && y > 17 && false)) : r() < 0.48;
      if (canto) { var lx = x > 17 ? x - 18 : x, ly = y > 17 ? y - 18 : y; on = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5); }
      if (on) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0C1613"/>';
    }
    return s + '</svg>';
  }
  function abaPix() {
    var c = E.carrinho;
    return '<div class="centro"><p class="muted" style="margin-bottom:16px;font-size:14.5px">Abra o app do seu banco e pague com o QR Code ou com o código copia e cola.</p>' +
      '<div class="qr">' + qrFalso(c.plano + (c.placa || '')) + '<div class="marca-demo">DEMO</div></div>' +
      '<p class="tiny" style="margin-top:12px">O código expira em <span class="contador" id="contador">10:00</span></p>' +
      '<div class="copia"><input readonly value="00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-PLACA-ABERTA-NAO-PAGAR5204000053039865802BR6009SAO PAULO"><button class="btn btn-sec" data-copiar>Copiar</button></div>' +
      '<button class="btn btn-pri btn-bloco" style="margin-top:18px" data-simular>Simular pagamento aprovado</button>' +
      '<p class="tiny" style="margin-top:10px">No site real, a confirmação chega sozinha em poucos segundos.</p></div>';
  }
  function abaCartao() {
    return '<p class="muted" style="font-size:14.5px;margin-bottom:16px">Neste protótipo os campos ficam travados para que nenhum dado real de cartão seja digitado.</p>' +
      campo('cartao', 'Número do cartão', 'text', '0000 0000 0000 0000', '', '', ' readonly') +
      '<div class="grade2">' + campo('validade', 'Validade', 'text', 'MM/AA', '', '', ' readonly') + campo('cvv', 'CVV', 'text', '000', '', '', ' readonly') + '</div>' +
      campo('titular', 'Nome impresso no cartão', 'text', 'Como está no cartão', '', '', ' readonly') +
      '<div class="campo"><label>Parcelas</label><select disabled><option>1x sem juros</option></select></div>' +
      '<button class="btn btn-pri btn-bloco" data-simular>Simular pagamento aprovado</button>';
  }

  function pSucesso() {
    var c = E.ultimaCompra || {};
    var p = PLANOS[c.plano] || PLANOS.basica;
    return '<div class="auth centro"><div class="cadeado" style="width:64px;height:64px;border-radius:20px">' + '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E6BE0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' + '</div>' +
      '<h1>Pagamento aprovado</h1><p class="muted" style="margin:8px 0 26px">' + esc(p.nome) + ' por ' + moeda(p.preco) + '. O comprovante foi enviado para o seu e-mail.</p>' +
      (c.placa ? '<a class="btn btn-pri btn-bloco" href="#/relatorio/' + c.placa + '">Abrir a ficha de ' + esc(fmt(c.placa)) + '</a>' : '<a class="btn btn-pri btn-bloco" href="#/conta">Ir para minha conta</a>') +
      '<a class="btn btn-sec btn-bloco" style="margin-top:10px" href="#/">Fazer outra consulta</a></div>';
  }

  function pRelatorio(placa) {
    if (!E.desbloqueadas[placa]) { ir('#/consulta/' + placa); return ''; }
    var v = veiculo(placa); var tipo = E.desbloqueadas[placa]; var completa = tipo === 'completa';
    var abertas = v.multas.filter(function (m) { return m.aberta; });
    var totalMultas = abertas.reduce(function (s, m) { return s + m.valor; }, 0);
    var monit = E.monitorados.indexOf(placa) >= 0;
    var pil1 = Math.max(10, 100 - abertas.length * 22), pil2 = v.ipva ? 35 : 100, pil3 = v.gravame ? 60 : 100, pil4 = (v.leilao || v.sinistro) ? 30 : 100;
    function pilar(n, val) { return '<div class="pilar"><small>' + n + '</small><div class="barra"><i style="width:' + val + '%;background:' + corIndice(val) + '"></i></div></div>'; }
    var multasHTML = v.multas.length ? '<table class="tabela"><thead><tr><th>Data</th><th>Infração</th><th class="esconde-m">Órgão</th><th>Situação</th><th class="num">Valor</th></tr></thead><tbody>' +
      v.multas.map(function (m) { return '<tr><td class="mono">' + m.data + '</td><td>' + esc(m.desc) + '<div class="tiny">' + esc(m.local) + ' | ' + m.gravidade + '</div></td><td class="esconde-m">' + m.orgao + '</td><td>' + (m.aberta ? pil('Em aberto', 'ruim') : pil('Paga', 'ok')) + '</td><td class="num">' + moeda(m.valor) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="muted">Nenhuma multa encontrada para este veículo.</p>';
    var bloqueio = function (t) { return '<div class="card" style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><h3 style="margin-bottom:4px">' + t + '</h3><p class="muted" style="font-size:14px">Disponível na consulta Completa.</p></div><a class="btn btn-sec" href="#/planos?placa=' + placa + '">Ver a Completa</a></div>'; };
    return '<div class="no-print" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px"><a class="voltar" href="#/conta/consultas" style="margin:0">Minhas consultas</a><div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-sec" data-monitorar="' + placa + '">' + (monit ? 'Monitorando' : 'Monitorar este veículo') + '</button><button class="btn btn-sec" data-imprimir>Baixar PDF</button><button class="btn btn-sec" data-compartilhar="' + placa + '">Compartilhar</button></div></div>' +
      '<div class="card" style="padding:28px"><div class="res-topo">' + placaHTML(placa) + '<div><span class="pilula ' + (completa ? 'ok' : '') + '"><span class="ponto"></span>Consulta ' + (completa ? 'Completa' : 'Básica') + ' | ' + hoje() + '</span>' +
      '<h1 style="font-size:clamp(24px,3.2vw,34px);margin-top:10px">' + esc(v.marca + ' ' + v.modelo) + '</h1><p class="muted">' + esc(v.ano + ' | ' + v.combustivel + ' | ' + v.cor + ' | ' + v.municipio) + '</p></div>' +
      '<div style="display:flex;gap:16px;align-items:center">' + anel(v.indice) + '<div><small class="tiny">Índice Placa Aberta</small><b style="display:block;font-weight:500;color:' + corIndice(v.indice) + '">' + veredito(v.indice) + '</b></div></div></div>' +
      '<div class="pilares">' + pilar('Multas', pil1) + pilar('Débitos', pil2) + pilar('Financiamento', pil3) + pilar('Histórico', pil4) + '</div></div>' +

      '<div class="grade2 secao-rel">' +
      '<div class="card"><h3>Situação ' + (v.licenciado ? pil('Regular', 'ok') : pil('Pendente', 'ruim')) + '</h3>' + kv('Situação do veículo', 'Em circulação') + kv('Licenciamento 2026', v.licenciado ? 'Pago' : 'Em aberto') + kv('IPVA 2026', v.ipva ? '<span style="color:var(--alerta)">' + moeda(v.ipva) + ' em aberto</span>' : 'Pago') + kv('Roubo ou furto', 'Nada consta') + '</div>' +
      '<div class="card"><h3>Restrições ' + (v.ipva ? pil('Consta', 'atencao') : pil('Nada consta', 'ok')) + '</h3>' + kv('Judicial (Renajud)', 'Nada consta') + kv('Administrativa', 'Nada consta') + kv('Tributária', v.ipva ? 'IPVA em aberto' : 'Nada consta') + kv('Bloqueio de transferência', 'Nada consta') + '</div></div>' +

      '<div class="secao-rel"><div class="card"><h3>Multas ' + (abertas.length ? pil(abertas.length + ' em aberto | ' + moeda(totalMultas), 'ruim') : pil('Nada em aberto', 'ok')) + '</h3>' + multasHTML + '</div></div>' +

      (completa ?
        '<div class="grade2 secao-rel">' +
        '<div class="card"><h3>Gravame ' + (v.gravame ? pil('Consta', 'atencao') : pil('Nada consta', 'ok')) + '</h3>' + kv('Tipo', v.gravame ? 'Alienação fiduciária' : 'Sem gravame') + kv('Financeira', v.gravame ? esc(v.financeira) : '-') + kv('Situação', v.gravame ? 'Ativo' : '-') + '</div>' +
        '<div class="card"><h3>Leilão e sinistro ' + ((v.leilao || v.sinistro) ? pil('Atenção', 'ruim') : pil('Nada consta', 'ok')) + '</h3>' + kv('Passagem por leilão', v.leilao ? 'Consta (2021)' : 'Nada consta') + kv('Sinistro ou perda total', v.sinistro ? 'Consta média monta' : 'Nada consta') + kv('Recall', v.recall ? '<span style="color:var(--aviso)">1 pendente</span>' : 'Nada pendente') + '</div></div>' +
        '<div class="grade2 secao-rel">' +
        '<div class="card"><h3>Histórico</h3>' + kv('Número de proprietários', v.proprietarios) + '<div class="trajeto">' + v.trajeto.map(function (c, i) { return (i ? '<span class="seta"></span>' : '') + '<div class="mun"><i></i>' + esc(c) + '</div>'; }).join('') + '</div></div>' +
        '<div class="card"><h3>Preço de referência</h3>' + kv('Tabela de referência', moeda(v.fipe)) + kv('Faixa de mercado', moeda(v.fipe * 0.93) + ' a ' + moeda(v.fipe * 1.05)) + '<p class="tiny" style="margin-top:8px">Valor ilustrativo. Considere o estado de conservação e a quilometragem.</p></div></div>'
        : '<div class="secao-rel">' + bloqueio('Gravame, leilão, sinistro, recall e histórico') + '</div>') +
      '<p class="tiny" style="margin-top:22px">Dados fictícios gerados para demonstração. Nome e documento de proprietários não são exibidos.</p>';
  }

  // ---------- conta ----------
  function lateral(atual) {
    var itens = [['', 'Visão geral'], ['consultas', 'Minhas consultas'], ['monitorados', 'Veículos monitorados'], ['pagamentos', 'Pagamentos']];
    return '<aside class="lateral">' + itens.map(function (i) { return '<a class="' + (atual === i[0] ? 'ativo' : '') + '" href="#/conta' + (i[0] ? '/' + i[0] : '') + '">' + i[1] + '</a>'; }).join('') + '<a href="#/configuracoes">Configurações</a></aside>';
  }
  function listaConsultas(lim) {
    var l = E.consultas.slice().reverse(); if (lim) l = l.slice(0, lim);
    if (!l.length) return '<div class="vazio">Você ainda não fez nenhuma consulta.<br><a class="btn btn-pri" style="margin-top:14px" href="#/">Consultar uma placa</a></div>';
    return l.map(function (c) { var v = veiculo(c.placa); return '<div class="item-veic">' + placaHTML(c.placa, true) + '<div class="info"><b>' + esc(v.marca + ' ' + v.modelo) + '</b><small>Consulta ' + (c.tipo === 'completa' ? 'Completa' : 'Básica') + ' em ' + c.data + '</small></div><a class="btn btn-sec" href="#/relatorio/' + c.placa + '">Abrir</a></div>'; }).join('');
  }
  function pConta(sub) {
    if (!E.usuario) { ir('#/entrar?voltar=' + encodeURIComponent('#/conta')); return ''; }
    var corpo = '';
    if (!sub) {
      corpo = '<h1 style="font-size:30px">Olá, ' + esc(E.usuario.nome.split(' ')[0]) + '</h1><p class="muted" style="margin-bottom:24px">Aqui ficam suas consultas, créditos e veículos monitorados.</p>' +
        '<div class="grade3"><div class="card kpi"><small>Créditos Básica</small><b>' + E.creditos.basica + '</b></div><div class="card kpi"><small>Créditos Completa</small><b>' + E.creditos.completa + '</b></div><div class="card kpi"><small>Monitoramento</small><b style="font-size:20px;margin-top:12px">' + (E.assinatura ? '<span class="verde">Ativo</span>' : 'Inativo') + '</b></div></div>' +
        '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">Nova consulta</h3>' + formBusca('', 'busca-conta') + '</div>' +
        '<div class="card" style="margin-top:16px"><div class="sec-tit" style="margin-bottom:6px"><h3>Últimas consultas</h3><a class="tiny verde" href="#/conta/consultas">Ver todas</a></div>' + listaConsultas(3) + '</div>';
    } else if (sub === 'consultas') {
      corpo = '<h1 style="font-size:30px;margin-bottom:20px">Minhas consultas</h1><div class="card">' + listaConsultas() + '</div>';
    } else if (sub === 'monitorados') {
      var lista = E.monitorados.length ? E.monitorados.map(function (p) { var v = veiculo(p); var ab = v.multas.filter(function (m) { return m.aberta; }).length; return '<div class="item-veic">' + placaHTML(p, true) + '<div class="info"><b>' + esc(v.marca + ' ' + v.modelo) + '</b><small>Última verificação hoje, 06:00</small></div>' + (ab ? pil(ab + ' multa(s) em aberto', 'ruim') : pil('Tudo em dia', 'ok')) + '<button class="btn btn-sec" data-desmonitorar="' + p + '">Remover</button></div>'; }).join('')
        : '<div class="vazio">Nenhum veículo monitorado. Abra uma ficha e toque em "Monitorar este veículo".</div>';
      corpo = '<h1 style="font-size:30px;margin-bottom:8px">Veículos monitorados</h1><p class="muted" style="margin-bottom:20px">' + (E.assinatura ? 'Assinatura ativa. Você pode monitorar até 3 veículos.' : 'Assine o monitoramento para receber avisos de multa nova e mudanças de restrição.') + '</p>' +
        (E.assinatura ? '' : '<div class="card destaque" style="margin-bottom:16px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center"><div><h3>Monitoramento por ' + moeda(9.90) + '/mês</h3><p class="muted" style="font-size:14px">Até 3 veículos, cancele quando quiser.</p></div><button class="btn btn-pri" data-plano="monitor">Assinar</button></div>') +
        '<div class="card">' + lista + '</div>';
    } else if (sub === 'pagamentos') {
      var pg = E.pagamentos.slice().reverse();
      corpo = '<h1 style="font-size:30px;margin-bottom:20px">Pagamentos</h1><div class="card">' + (pg.length ? '<table class="tabela"><thead><tr><th>Data</th><th>Descrição</th><th class="esconde-m">Forma</th><th class="num">Valor</th></tr></thead><tbody>' +
        pg.map(function (p) { return '<tr><td class="mono">' + p.data + '</td><td>' + esc(p.desc) + '</td><td class="esconde-m">' + p.metodo + '</td><td class="num">' + moeda(p.valor) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="vazio">Nenhum pagamento ainda.</div>') + '</div>';
    }
    return '<div class="conta">' + lateral(sub || '') + '<div>' + corpo + '</div></div>';
  }

  function pConfig(sub) {
    if (!E.usuario) { ir('#/entrar?voltar=' + encodeURIComponent('#/configuracoes')); return ''; }
    var u = E.usuario; var pr = E.prefs;
    function tg(nome, t, d) { return '<div class="opcao"><div><b>' + t + '</b><small>' + d + '</small></div><label class="toggle"><input type="checkbox" data-pref="' + nome + '"' + (pr[nome] ? ' checked' : '') + '><i></i></label></div>'; }
    return '<div class="conta">' + lateral('config') + '<div><h1 style="font-size:30px;margin-bottom:20px">Configurações</h1>' +
      '<div class="card"><h3 style="margin-bottom:16px">Perfil</h3><form id="f-perfil" novalidate>' +
      '<div class="grade2">' + campo('nome', 'Nome', 'text', '', 'Informe seu nome.', u.nome) + campo('email', 'E-mail', 'email', '', 'Informe um e-mail válido.', u.email) + '</div>' +
      '<div class="grade2">' + campo('celular', 'Celular', 'tel', '', 'Informe um celular válido.', u.celular) + campo('cpf', 'CPF (opcional, para a nota fiscal)', 'text', '000.000.000-00', 'CPF inválido.', u.cpf || '') + '</div>' +
      '<button class="btn btn-pri" type="submit">Salvar alterações</button></form></div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:16px">Segurança</h3><form id="f-senha" novalidate><div class="grade2">' + campo('atual', 'Senha atual', 'password', '', 'Informe a senha atual.') + campo('nova', 'Nova senha', 'password', 'Mínimo de 8 caracteres', 'A senha precisa ter pelo menos 8 caracteres.') + '</div>' +
      '<button class="btn btn-sec" type="submit">Trocar senha</button></form>' +
      '<div class="opcao" style="margin-top:12px"><div><b>Verificação em duas etapas</b><small>Pede um código por SMS ao entrar em um aparelho novo.</small></div><label class="toggle"><input type="checkbox" data-pref="doisFatores"' + (pr.doisFatores ? ' checked' : '') + '><i></i></label></div>' +
      '<div class="opcao"><div><b>Sessões ativas</b><small>Este navegador e o app no celular.</small></div><button class="btn btn-sec" data-sessoes>Sair dos outros aparelhos</button></div></div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:6px">Notificações</h3>' + tg('email', 'Avisos por e-mail', 'Multa nova, restrição e lembretes de IPVA.') + tg('whatsapp', 'Avisos por WhatsApp', 'Mensagem curta quando algo mudar no veículo.') + tg('push', 'Notificações no app', 'Alertas no celular em tempo real.') + tg('resumo', 'Resumo mensal', 'Um e-mail por mês com a situação dos seus veículos.') + tg('novidades', 'Novidades e ofertas', 'Promoções e novos tipos de consulta.') + '</div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:6px">Assinatura</h3><div class="opcao"><div><b>Monitoramento</b><small>' + (E.assinatura ? 'Ativo, ' + moeda(9.90) + ' por mês. Próxima cobrança em 30 dias.' : 'Você não assina o monitoramento.') + '</small></div>' + (E.assinatura ? '<button class="btn btn-perigo" data-cancelar>Cancelar assinatura</button>' : '<button class="btn btn-pri" data-plano="monitor">Assinar</button>') + '</div></div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:6px">Privacidade e dados</h3>' +
      '<div class="opcao"><div><b>Baixar meus dados</b><small>Um arquivo com seu cadastro, consultas e pagamentos (LGPD).</small></div><button class="btn btn-sec" data-baixar>Baixar</button></div>' +
      '<div class="opcao"><div><b>Excluir minha conta</b><small>Apaga cadastro, histórico e créditos. Não dá para desfazer.</small></div><button class="btn btn-perigo" data-excluir>Excluir conta</button></div></div>' +
      '</div></div>';
  }

  function pTexto(tipo) {
    var t = tipo === 'termos' ? ['Termos de uso', ['O que é o serviço', 'O Placa Aberta reúne informações públicas e de bases autorizadas sobre veículos, a partir da placa. O serviço é independente e não tem vínculo com órgãos de trânsito.'], ['Uso permitido', 'As consultas servem para avaliar a compra, a venda ou a situação de um veículo. Não é permitido usar o serviço para identificar, localizar ou perseguir pessoas.'], ['Créditos e pagamentos', 'Créditos valem por 12 meses a partir da compra. Consultas já abertas não são reembolsáveis, salvo falha do serviço.']]
      : ['Política de privacidade', ['Dados que coletamos', 'Nome, e-mail, celular e, se você informar, o CPF para a nota fiscal. Guardamos o histórico das placas que você consultou.'], ['Dados que não mostramos', 'O Placa Aberta não exibe nome, CPF ou endereço de proprietários de veículos.'], ['Seus direitos', 'Você pode baixar ou excluir seus dados a qualquer momento em Configurações, conforme a LGPD.']];
    return '<div class="texto-legal"><h1 style="font-size:34px">' + t[0] + '</h1><p class="tiny" style="margin-top:8px">Texto provisório do protótipo. A versão final deve ser revisada por um advogado.</p>' +
      t.slice(1).map(function (s) { return '<h2>' + s[0] + '</h2><p>' + s[1] + '</p>'; }).join('') + '</div>';
  }
  function pNaoEncontrado(msg) { return '<div class="auth centro"><h1>' + (msg || 'Página não encontrada') + '</h1><p class="muted" style="margin:10px 0 24px">Confira a placa e tente de novo.</p>' + formBusca('', 'busca-404') + '</div>'; }

  // ---------- ações ----------
  function usarCredito(placa) {
    var tipo = E.creditos.completa > 0 ? 'completa' : 'basica';
    E.creditos[tipo]--; E.desbloqueadas[placa] = tipo;
    E.consultas.push({ placa: placa, tipo: tipo, data: hoje() }); salvar();
    ir('#/relatorio/' + placa);
  }
  function comprar(id, placa) {
    E.carrinho = { plano: id, placa: placa || null }; salvar();
    if (!E.usuario) { ir('#/cadastro?voltar=' + encodeURIComponent('#/checkout')); return; }
    ir('#/checkout');
  }
  function concluirPagamento(metodo) {
    var c = E.carrinho; if (!c) return; var p = PLANOS[c.plano];
    if (p.creditos.basica) E.creditos.basica += p.creditos.basica;
    if (p.creditos.completa) E.creditos.completa += p.creditos.completa;
    if (c.plano === 'monitor') E.assinatura = true;
    E.pagamentos.push({ data: hoje(), desc: p.nome + (c.placa ? ' (' + fmt(c.placa) + ')' : ''), valor: p.preco, metodo: metodo });
    E.ultimaCompra = { plano: c.plano, placa: c.placa };
    if (c.placa && c.plano !== 'monitor') {
      var tipo = p.creditos.completa ? 'completa' : 'basica'; E.creditos[tipo]--; E.desbloqueadas[c.placa] = tipo;
      E.consultas.push({ placa: c.placa, tipo: tipo, data: hoje() });
    }
    E.carrinho = null; salvar(); ir('#/sucesso');
  }
  function validarCampos(form, regras) {
    var ok = true;
    Object.keys(regras).forEach(function (n) {
      var el = form.elements[n]; var bom = regras[n](el.value.trim());
      el.parentNode.classList.toggle('invalido', !bom); if (!bom) ok = false;
    });
    return ok;
  }
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var celOk = function (v) { return v.replace(/\D/g, '').length >= 10; };
  function modal(html) {
    var f = document.createElement('div'); f.className = 'modal-fundo'; f.innerHTML = '<div class="card modal">' + html + '</div>';
    document.body.appendChild(f); f.addEventListener('click', function (e) { if (e.target === f || e.target.hasAttribute('data-fechar')) f.remove(); });
    return f;
  }

  function ligar(params) {
    $$('form[data-busca]').forEach(function (f) {
      var inp = f.elements.placa;
      inp.addEventListener('input', function () { var v = limpar(inp.value).slice(0, 7); inp.value = /^[A-Z]{3}[0-9]{4}$/.test(v) ? v.slice(0, 3) + '-' + v.slice(3) : v; });
      f.addEventListener('submit', function (e) {
        e.preventDefault(); var p = limpar(inp.value); var err = $('#' + f.getAttribute('data-busca') + '-erro');
        if (!valida(p)) { if (err) err.textContent = 'Placa inválida. Use o formato ABC1D23 ou ABC-1234.'; return; }
        ir('#/consulta/' + p);
      });
    });
    $$('[data-plano]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-plano'); if (id === 'monitor' && E.assinatura) { toast('Sua assinatura já está ativa.'); return; } comprar(id, id === 'monitor' ? null : params.placa); }; });
    $$('[data-usar]').forEach(function (b) { b.onclick = function () { usarCredito(b.getAttribute('data-usar')); }; });
    $$('[data-google]').forEach(function (b) { b.onclick = function () { toast('No protótipo, o login com Google ainda não funciona. Use o e-mail.'); }; });

    var fe = $('#f-entrar');
    if (fe) fe.onsubmit = function (e) {
      e.preventDefault(); if (!validarCampos(fe, { email: emailOk, senha: function (v) { return v.length > 0; } })) return;
      var em = fe.elements.email.value.trim();
      E.usuario = E.usuario && E.usuario.email === em ? E.usuario : { nome: em.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }), email: em, celular: '(11) 90000-0000' };
      salvar(); toast('Bem-vindo de volta.'); ir(fe.getAttribute('data-volta'));
    };
    var fc = $('#f-cadastro');
    if (fc) fc.onsubmit = function (e) {
      e.preventDefault();
      var ok = validarCampos(fc, { nome: function (v) { return v.length >= 2; }, email: emailOk, celular: celOk, senha: function (v) { return v.length >= 8; } });
      if (!fc.elements.termos.checked) { toast('Para continuar, aceite os Termos e a Política de privacidade.'); ok = false; }
      if (!ok) return;
      E.usuario = { nome: fc.elements.nome.value.trim(), email: fc.elements.email.value.trim(), celular: fc.elements.celular.value.trim(), verificado: false };
      salvar(); ir('#/codigo?voltar=' + encodeURIComponent(fc.getAttribute('data-volta')));
    };
    var fco = $('#f-codigo');
    if (fco) fco.onsubmit = function (e) {
      e.preventDefault(); if (!validarCampos(fco, { codigo: function (v) { return /^\d{6}$/.test(v); } })) return;
      if (E.usuario) E.usuario.verificado = true; salvar(); toast('Celular confirmado. Conta criada.'); ir(fco.getAttribute('data-volta'));
    };
    $$('[data-reenviar]').forEach(function (a) { a.onclick = function () { toast('Código reenviado.'); }; });
    var fes = $('#f-esqueci');
    if (fes) fes.onsubmit = function (e) { e.preventDefault(); if (!validarCampos(fes, { email: emailOk })) return; toast('Se o e-mail estiver cadastrado, você receberá o link.'); ir('#/entrar'); };

    // checkout
    $$('[data-aba]').forEach(function (b) {
      b.onclick = function () { $$('[data-aba]').forEach(function (x) { x.classList.remove('ativo'); }); b.classList.add('ativo'); $('#pagto').innerHTML = b.getAttribute('data-aba') === 'pix' ? abaPix() : abaCartao(); ligarPagto(); };
    });
    ligarPagto();

    // relatorio
    $$('[data-imprimir]').forEach(function (b) { b.onclick = function () { window.print(); }; });
    $$('[data-compartilhar]').forEach(function (b) {
      b.onclick = function () {
        var url = location.href; var txt = 'Ficha Placa Aberta da placa ' + fmt(b.getAttribute('data-compartilhar'));
        if (navigator.share) navigator.share({ title: 'Placa Aberta', text: txt, url: url }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copiado.'); }, function () { toast('Não foi possível copiar o link.'); });
      };
    });
    $$('[data-monitorar]').forEach(function (b) {
      b.onclick = function () {
        var p = b.getAttribute('data-monitorar');
        if (E.monitorados.indexOf(p) >= 0) { ir('#/conta/monitorados'); return; }
        if (!E.assinatura) { comprar('monitor'); return; }
        if (E.monitorados.length >= 3) { toast('O limite é de 3 veículos. Remova um para adicionar outro.'); return; }
        E.monitorados.push(p); salvar(); toast('Veículo adicionado ao monitoramento.'); render();
      };
    });
    $$('[data-desmonitorar]').forEach(function (b) { b.onclick = function () { var p = b.getAttribute('data-desmonitorar'); E.monitorados = E.monitorados.filter(function (x) { return x !== p; }); salvar(); render(); }; });

    // config
    var fp = $('#f-perfil');
    if (fp) fp.onsubmit = function (e) {
      e.preventDefault(); if (!validarCampos(fp, { nome: function (v) { return v.length >= 2; }, email: emailOk, celular: celOk, cpf: function (v) { return !v || v.replace(/\D/g, '').length === 11; } })) return;
      E.usuario.nome = fp.elements.nome.value.trim(); E.usuario.email = fp.elements.email.value.trim(); E.usuario.celular = fp.elements.celular.value.trim(); E.usuario.cpf = fp.elements.cpf.value.trim();
      salvar(); topo(); toast('Dados atualizados.');
    };
    var fs = $('#f-senha');
    if (fs) fs.onsubmit = function (e) { e.preventDefault(); if (!validarCampos(fs, { atual: function (v) { return v.length > 0; }, nova: function (v) { return v.length >= 8; } })) return; fs.reset(); toast('Senha alterada.'); };
    $$('[data-pref]').forEach(function (i) { i.onchange = function () { E.prefs[i.getAttribute('data-pref')] = i.checked; salvar(); toast('Preferência salva.'); }; });
    $$('[data-sessoes]').forEach(function (b) { b.onclick = function () { toast('Você saiu dos outros aparelhos.'); }; });
    $$('[data-cancelar]').forEach(function (b) {
      b.onclick = function () {
        var m = modal('<h3 style="margin-bottom:8px">Cancelar o monitoramento?</h3><p class="muted" style="font-size:14.5px;margin-bottom:20px">Você deixa de receber avisos dos seus veículos no fim do período já pago.</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-sec" data-fechar>Manter</button><button class="btn btn-perigo" id="ok-cancelar">Cancelar assinatura</button></div>');
        $('#ok-cancelar', m).onclick = function () { E.assinatura = false; E.monitorados = []; salvar(); m.remove(); toast('Assinatura cancelada.'); render(); };
      };
    });
    $$('[data-baixar]').forEach(function (b) {
      b.onclick = function () {
        var dados = { usuario: E.usuario, consultas: E.consultas, pagamentos: E.pagamentos, monitorados: E.monitorados, preferencias: E.prefs };
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
        a.download = 'meus-dados-placa-aberta.json'; document.body.appendChild(a); a.click(); a.remove();
      };
    });
    $$('[data-excluir]').forEach(function (b) {
      b.onclick = function () {
        var m = modal('<h3 style="margin-bottom:8px">Excluir sua conta?</h3><p class="muted" style="font-size:14.5px;margin-bottom:14px">Seu cadastro, histórico de consultas e créditos serão apagados. Isso não pode ser desfeito.</p><div class="campo"><label>Digite EXCLUIR para confirmar</label><input id="conf-excluir" autocomplete="off"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-sec" data-fechar>Voltar</button><button class="btn btn-perigo" id="ok-excluir" disabled>Excluir conta</button></div>');
        var inp = $('#conf-excluir', m), ok = $('#ok-excluir', m);
        inp.oninput = function () { ok.disabled = inp.value.trim().toUpperCase() !== 'EXCLUIR'; };
        ok.onclick = function () { memoria = estadoInicial(); E = memoria; salvar(); m.remove(); toast('Conta excluída.'); ir('#/'); };
      };
    });
  }
  var timer = null;
  function ligarPagto() {
    $$('[data-copiar]').forEach(function (b) { b.onclick = function () { var v = b.previousElementSibling.value; if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () { toast('Código copiado.'); }, function () { toast('Copie o código manualmente.'); }); }; });
    $$('[data-simular]').forEach(function (b) { b.onclick = function () { var aba = $('[data-aba].ativo'); concluirPagamento(aba && aba.getAttribute('data-aba') === 'cartao' ? 'Cartão' : 'Pix'); }; });
    clearInterval(timer); var c = $('#contador');
    if (c) { var s = 600; timer = setInterval(function () { s--; if (s < 0) { clearInterval(timer); return; } var el = $('#contador'); if (!el) { clearInterval(timer); return; } el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 1000); }
  }

  // ---------- contagem de visitas (GoatCounter) ----------
  // Conta cada tela do protótipo como uma página. A placa digitada nunca é enviada.
  function contar(rota) {
    var caminho = '/prototipo/' + (rota || 'inicio');
    var tentativas = 0;
    (function enviar() {
      if (window.goatcounter && window.goatcounter.count) { try { window.goatcounter.count({ path: caminho, title: 'Protótipo: ' + (rota || 'início') }); } catch (e) {} return; }
      if (++tentativas < 20) setTimeout(enviar, 300);
    })();
  }

  // ---------- roteador ----------
  function render() {
    var h = location.hash || '#/'; var partes = h.slice(2).split('?'); var caminho = partes[0].split('/'); var params = {};
    (partes[1] || '').split('&').forEach(function (kvp) { if (!kvp) return; var x = kvp.split('='); params[decodeURIComponent(x[0])] = decodeURIComponent(x[1] || ''); });
    var r = caminho[0] || ''; var html;
    switch (r) {
      case '': html = pHome(); break;
      case 'como-funciona': html = pComoFunciona(); break;
      case 'consulta': html = pResultado(limpar(caminho[1])); break;
      case 'planos': if (params.placa) params.placa = limpar(params.placa); html = pPlanos(params); break;
      case 'entrar': html = pEntrar(params); break;
      case 'cadastro': html = pCadastro(params); break;
      case 'codigo': html = pCodigo(params); break;
      case 'esqueci': html = pEsqueci(); break;
      case 'checkout': html = pCheckout(); break;
      case 'sucesso': html = pSucesso(); break;
      case 'relatorio': html = pRelatorio(limpar(caminho[1])); break;
      case 'conta': html = pConta(caminho[1]); break;
      case 'configuracoes': html = pConfig(); break;
      case 'termos': case 'privacidade': html = pTexto(r); break;
      default: html = pNaoEncontrado();
    }
    if (html === '') return;
    topo(); $('#app').innerHTML = html; ligar(params); contar(r);
    if (r !== 'como-funciona') window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  render();
})();
