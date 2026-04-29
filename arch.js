

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔗 SUPABASE
const supabase = createClient(
  "https://ojuxpbfbosuufotitypt.supabase.co",
  "sb_publishable_2gCNm4hapvSy92cGQqXaNA_7zZU31v6"
);

// ======================================================
// 🔤 FORMATAR TEXTO
// ======================================================
function formatarTexto(texto) {
  if (!texto) return "";

  const siglas = ["bmw", "suv", "gti"];

  return texto
    .toLowerCase()
    .split(" ")
    .map(p => siglas.includes(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// ======================================================
// 🚀 INÍCIO
// ======================================================
document.addEventListener("DOMContentLoaded", () => {

  carregarListaVeiculos();
  carregarDetalhesVeiculo();
  configurarFormulario();
  configurarTitulo();
  configurarFiltros();
  esconderFiltroKmSeNovo();
  configurarProcurados();
  configurarCadastro();
  configurarLogin();
  configurarContato();
  atualizarUsuarioLogado();

});

async function carregarListaVeiculos() {

  const isHome = location.pathname === "/" || location.pathname.endsWith("index.html");
  /*const isHome = window.location.pathname.includes("index");*/

  const container = document.getElementById("lista-veiculos");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);

  const condicao = params.get("condicao");
  const marca = params.get("marca");
  const categoria = params.get("categoria");

  const ano = params.get("ano");
  const faixaAno = params.get("faixaAno");

  const preco = params.get("preco");
  const faixaPreco = params.get("faixaPreco");

  const km = params.get("km");
  const faixaKm = params.get("faixaKm");

  const combustivel = params.get("combustivel");

  let query = supabase.from("veiculos").select("*");

  if (isHome) query = query.limit(10);

  // ======================
  // FILTROS EXISTENTES
  // ======================
  if (condicao === "novos") {
    query = query.eq("quilometragem", 0);
  }

  if (condicao === "seminovos") {
    query = query.gt("quilometragem", 0);
  }

  if (marca) query = query.eq("marca", marca);
  if (categoria) query = query.eq("corpo", categoria);

  // ======================
  // 🔥 NOVO: ANO
  // ======================
  if (ano) {
    query = query.eq("ano", ano);
  }

  if (faixaAno) {
    const [min, max] = faixaAno.split("-");
    query = query.gte("ano", Number(max)).lte("ano", Number(min));
  }

  // ======================
  // 🔥 NOVO: PREÇO
  // ======================
  if (preco) {
    query = query.eq("preco", preco);
  }

  if (faixaPreco) {
    if (faixaPreco.includes("+")) {
      const min = faixaPreco.replace("+", "");
      query = query.gte("preco", Number(min));
    } else {
      const [min, max] = faixaPreco.split("-");
      query = query.gte("preco", Number(min)).lte("preco", Number(max));
    }
  }

  // ======================
  // 🔥 KM (CORRIGIDO)
  // ======================
  if (km !== null && km !== "") {
    query = query.eq("quilometragem", Number(km));
  }

  if (faixaKm) {

    // 👉 0km (caso especial)
    if (faixaKm === "0") {
      query = query.eq("quilometragem", 0);

    } else if (faixaKm.includes("+")) {
      const min = faixaKm.replace("+", "");
      if (!isNaN(min)) {
        query = query.gte("quilometragem", Number(min));
      }

    } else if (faixaKm.includes("-")) {
      const [min, max] = faixaKm.split("-");

      if (!isNaN(min) && !isNaN(max)) {
        query = query
          .gte("quilometragem", Number(min))
          .lte("quilometragem", Number(max));
      }
    }
  }

  // ======================
  // 🔥 COMBUSTÍVEL
  // ======================
  if (combustivel) {
    query = query.eq("combustivel", combustivel);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro lista:", error);
    return;
  }

  container.innerHTML= "";

  const semVeiculos = document.getElementById("sem-veiculos");

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div style =" 
        width: 300px;
        text-align: center;
        margin-top: 170px;
        margin-left: 480px;
        color:#666;
      ">
        <h3>Nenhum veículo encontrado</h3>
        <p>Tente ajustar os filtros ou limpar a busca.</p>
      </div>
    `;
    return;
    if (semVeiculos) semVeiculos.style.display = "block";
    return;
  } else {
    if (semVeiculos) semVeiculos.style.display = "none";
  }

  data.forEach(veiculo => {

    const card = document.createElement("a");
    card.href = `pagina-cada-veiculo.html?id=${veiculo.id}`;
    card.style.textDecoration = "none";
    card.style.color = "inherit";

    card.innerHTML = `
      <div class="card-veiculo">

        <div class="card-foto">
          <img src="${veiculo.imagem1}" alt="${veiculo.nome}">
        </div>

        <div class="marca-txt">
          <p>${formatarTexto(veiculo.marca)}</p>
          <p>${formatarTexto(veiculo.nome)}</p>
        </div>

        <div class="card-txt">

          <div class="card-ano">
            <i class="bi bi-calendar-week"></i>
            <p>${veiculo.ano}</p>
          </div>

          <div class="card-km">
            <i class="bi bi-speedometer"></i>
            <p>${veiculo.quilometragem} km</p>
          </div>

          <div class="card-combustivel">
            <i class="bi bi-fuel-pump"></i>
            <p>${formatarTexto(veiculo.combustivel)}</p>
          </div>

        </div>

        <div class="card-valor">
          <p>R$ ${Number(veiculo.preco).toLocaleString("pt-BR")}</p>
        </div>

      </div>
    `;

    container.appendChild(card);
  });

}

// ======================================================
// 🚘 DETALHES DO VEÍCULO (pagina-cada-veiculo)
// ======================================================

async function carregarDetalhesVeiculo() {

  const nomeEl = document.getElementById("nomeVeiculo");
  if (!nomeEl) return; // só roda na página certa

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const { data, error } = await supabase
    .from("veiculos")
    .select("*")
    .eq("id", id)
    .single();

    const imagens = [
      data.imagem1,
      data.imagem2,
      data.imagem3,
      data.imagem4,
      data.imagem5
    ].filter(img => img); // remove vazias/null

    let index = 0;

    const containerImg = document.getElementById("galeriaImagem");
    const setaLeft = document.querySelector(".seta-left");
    const setaRight = document.querySelector(".seta-right");

    function mostrarImagem() {
      if (!containerImg || imagens.length === 0) return;

      containerImg.innerHTML = `
        <img src="${imagens[index]}" style="width:100%; border-radius:10px;">
      `;
    }

    // 👉 botão esquerda
    setaLeft?.addEventListener("click", () => {
      index--;
      if (index < 0) index = imagens.length - 1;
      mostrarImagem();
    });

    // 👉 botão direita
    setaRight?.addEventListener("click", () => {
      index++;
      if (index >= imagens.length) index = 0;
      mostrarImagem();
    });

    // 👉 iniciar
    mostrarImagem();

  if (error) {
    console.error("Erro detalhes:", error);
    return;
  }

  // 🧠 PREENCHER DADOS
  nomeEl.textContent = formatarTexto(data.nome);

  document.getElementById("precoVeiculo").textContent =
    "R$ " + Number(data.preco).toLocaleString("pt-BR");

  document.getElementById("anoVeiculo").textContent = data.ano;
  document.getElementById("combustivelVeiculo").textContent = formatarTexto(data.combustivel);
  document.getElementById("kmVeiculos").textContent = data.quilometragem + " km";
  document.getElementById("cambioVeiculo").textContent = formatarTexto(data.cambio);
  document.getElementById("condicaoVeiculo").textContent = formatarTexto(data.condicao);
  document.getElementById("corpoVeiculo").textContent = formatarTexto(data.corpo);

  // 👉 marca no topo
  const marcaTxt = document.querySelector(".marca-txt");
  if (marcaTxt) {
    marcaTxt.textContent = formatarTexto(data.marca);
  }
}

// ======================================================
// 🏷️ TÍTULO DINÂMICO
// ======================================================
function configurarTitulo() {

  const titulo = document.getElementById("titulopagina");
  if (!titulo) return;

  const params = new URLSearchParams(window.location.search);

  const condicao = params.get("condicao");
  const marca = params.get("marca");
  const categoria = params.get("categoria");

  let texto = "";

  if (marca) {
    texto = formatarTexto(marca);

  } else if (categoria) {
    texto = formatarTexto(categoria);

  } else if (condicao === "novos") {
    texto = "Carros Novos";

  } else if (condicao === "seminovos") {
    texto = "Carros Seminovos";

  } else {
    texto = "Todos os Veículos";
  }

  titulo.textContent = texto.toUpperCase();
}

// ======================================================
// 📩 FORMULÁRIO (abrir/fechar)
// ======================================================
function configurarFormulario() {

  const btnAbrir = document.getElementById("btnAbrir");
  const btnFechar = document.getElementById("btnFechar");
  const formContainer = document.getElementById("formContainer");

  if (!btnAbrir || !formContainer) return;

  btnAbrir.addEventListener("click", () => {
    formContainer.style.display = "flex";
  });

  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      formContainer.style.display = "none";
    });
  }

  formContainer.addEventListener("click", (e) => {
    if (e.target === formContainer) {
      formContainer.style.display = "none";
    }
  });
}

async function uploadEmLote(files) {
  for (const file of files) {

    const nomeArquivo = file.name;

    const { error } = await supabase.storage
      .from('veiculos')
      .upload(nomeArquivo, file);

    if (error) {
      console.error("Erro:", error);
    } else {
      console.log("Enviado:", nomeArquivo);
    }
  }
}

// ======================================================
// 🎛️ FILTROS (ANO / PREÇO / KM / COMBUSTÍVEL)
// ======================================================
function configurarFiltros() {

  const btnFiltrar = document.getElementById("btnFiltrar");
  const btnLimpar = document.getElementById("btnLimpar");

  if (!btnFiltrar) return;

  btnFiltrar.addEventListener("click", () => {
    aplicarFiltros();
  });

  btnLimpar?.addEventListener("click", () => {

    const params = new URLSearchParams(window.location.search);

    const condicao = params.get("condicao");
    const marca = params.get("marca");
    const categoria = params.get("categoria");

    const novoParams = new URLSearchParams();

    // 👉 mantém o que importa
    if (condicao) novoParams.set("condicao", condicao);
    if (marca) novoParams.set("marca", marca);
    if (categoria) novoParams.set("categoria", categoria);

    window.location.href = `${window.location.pathname}?${novoParams.toString()}`;
  });
}

/*

function aplicarFiltros() {

  const params = new URLSearchParams(window.location.search);

  // ===== ANO =====
  const filtroAno = document.querySelector("select[name='filtro-2']").value;
  const anoEspecifico = document.getElementById("anoEspecifico").value;

  if (anoEspecifico) {
    params.set("ano", anoEspecifico);
  } else if (filtroAno) {
    params.set("faixaAno", filtroAno);
  }

  // ===== PREÇO =====
  const filtroPreco = document.querySelector(".card-filtro3 select").value;

  if (filtroPreco) {
    params.set("faixaPreco", filtroPreco);
  }

  // ===== KM =====
  const filtroKm = document.querySelector("#filtroKm select").value;

  if (filtroKm) {
    params.set("faixaKm", filtroKm);
  }

  // ===== COMBUSTÍVEL =====
  const combustivel = document.querySelector(".card-filtro5 select").value;
  if (combustivel) {
    params.set("combustivel", combustivel);
  }

  // redireciona com filtros
  window.location.href = `${window.location.pathname}?${params.toString()}`;
}

*/

function aplicarFiltros() {

  // 👉 mantém os parâmetros atuais (condicao, marca, etc.)
  const params = new URLSearchParams(window.location.search);

  const condicaoAtual = params.get("condicao");

  // 👉 limpa filtros antigos
  params.delete("ano");
  params.delete("faixaAno");
  params.delete("preco");
  params.delete("faixaPreco");
  params.delete("km");
  params.delete("faixaKm");
  params.delete("combustivel");

  // ===== ANO =====
  const filtroAno = document.querySelector("select[name='filtro-2']").value;

  if (filtroAno) {
    params.set("faixaAno", filtroAno);
  }

  // ===== PREÇO =====
  const filtroPreco = document.querySelector(".card-filtro3 select").value;

  if (filtroPreco) {
    params.set("faixaPreco", filtroPreco);
  }

  // ===== KM (🚫 BLOQUEADO PARA NOVOS)
  if (condicaoAtual !== "novos") {

    const filtroKm = document.querySelector("#filtroKm select").value;

  if (filtroKm) {
      params.set("faixaKm", filtroKm);
    }

  }

  // ===== COMBUSTÍVEL =====
  const combustivel = document.querySelector(".card-filtro5 select").value;
  if (combustivel) {
    params.set("combustivel", combustivel);
  }

  // 👉 mantém condicao=novos automaticamente
  window.location.href = `${window.location.pathname}?${params.toString()}`;
}

function esconderFiltroKmSeNovo() {

  const params = new URLSearchParams(window.location.search);
  const condicao = params.get("condicao");

  if (condicao === "novos") {
    const filtroKm = document.getElementById("filtroKm");
    if (filtroKm) {
      filtroKm.style.display = "none";
    }
  }
}

function configurarProcurados() {

  const cards = document.querySelectorAll(".card-procurados");

  cards.forEach(card => {
    card.addEventListener("click", async () => {

      const nome = card.dataset.nome;

      // busca no banco
      const { data, error } = await supabase
        .from("veiculos")
        .select("id")
        .ilike("nome", `%${nome}%`)
        .limit(1)
        .single();

      if (error || !data) {
        console.error("Veículo não encontrado");
        return;
      }

      // redireciona
      window.location.href = `pagina-cada-veiculo.html?id=${data.id}`;
    });
  });

}

function configurarCadastro() {

  const form = document.getElementById("formCadastro");

  // 👉 só roda se estiver na página de cadastro
  if (!form) return;

  console.log("Cadastro ativo 🚀");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("CLICOU 🚀");

    const email = document.getElementById("emailCadastro").value;
    const senha = document.getElementById("senhaCadastro").value;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha
    });

    if (error) {
      console.error(error);
      alert("Erro: " + error.message);
      return;
    }

    alert("Cadastro realizado! Verifique seu email 📩");
  });

}

function configurarLogin() {

  const form = document.getElementById("formLogin");
  if (!form) return;

  console.log("Login ativo 🔐");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("emailLogin").value;
    const senha = document.getElementById("senhaLogin").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (error) {
      console.error(error);
      alert("Erro: " + error.message);
      return;
    }

    alert("Login realizado com sucesso! 🚀");

    // 👉 redireciona
    window.location.href = "index.html";
  });

}

function configurarContato() {

  const btnAbrir = document.getElementById("btnAbrirContato");
  const btnFechar = document.getElementById("btnFechar");
  const container = document.getElementById("formContainer");
  const form = document.getElementById("formContato");

  if (!btnAbrir || !container) return;

  // 🔒 ABRIR COM VERIFICAÇÃO
  btnAbrir.addEventListener("click", async () => {

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      alert("Você precisa estar logado para entrar em contato 🔐");
      window.location.href = "entrar.html";
      return;
    }

    // 👉 usuário logado → abre
    container.style.display = "flex";

    // 👉 preenche email automaticamente
    const inputEmail = document.getElementById("emailContato");
    if (inputEmail) {
      inputEmail.value = data.user.email;
    }

  });

  // fechar
  btnFechar?.addEventListener("click", () => {
    container.style.display = "none";
  });

  // clicar fora
  container.addEventListener("click", (e) => {
    if (e.target === container) {
      container.style.display = "none";
    }
  });

  // envio
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeContato").value;
    const email = document.getElementById("emailContato").value;
    const mensagem = document.getElementById("mensagemContato").value;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("Você precisa estar logado!");
      return;
    }

    const user = userData.user;

    const params = new URLSearchParams(window.location.search);
    const veiculoId = params.get("id");

    const { error } = await supabase
      .from("mensagens")
      .insert([
        {
          nome,
          email,
          mensagem,
          veiculo_id: veiculoId,
          user_id: user.id
        }
      ]);

    if (error) {
      console.error(error);
      alert("Erro ao enviar");
      return;
    }

    alert("Mensagem enviada! 🚀");

    form.reset();
    container.style.display = "none";
  });

}

const containerUser = document.querySelector(".container-user");
const btnEntrar = document.getElementById("btnEntrar");

/*

async function atualizarUsuarioLogado() {

  const btnEntrar = document.getElementById("btnEntrar");

  if (!containerUser) return;

  // 🔥 força pegar sessão atual (mais confiável que getUser sozinho)
  const { data: { session } } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    containerUser.style.display = "none";
    containerUser.innerHTML = "";
    return;
  }

  containerUser.style.display = "block";

  containerUser.innerHTML = `
    <div class="user-box">
      <p>Logado como:</p>
      <strong>${user.email}</strong>
      <button id="btnLogout">Sair</button>
    </div>
  `;

  document.getElementById("btnLogout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    atualizarUsuarioLogado();
    window.location.href = "pagina-inicial.html";
  });
}

*/

async function atualizarUsuarioLogado() {

  if (!containerUser) return;

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // 🔥 controla botão "Entrar"
  if (btnEntrar) {
    btnEntrar.style.display = user ? "none" : "inline-block";
  }

  if (!user) {
    containerUser.style.display = "none";
    containerUser.innerHTML = "";
    return;
  }

  containerUser.style.display = "block";

  containerUser.innerHTML = `
    <div class="user-box">
      <p>Logado como:</p>
      <strong>${user.email}</strong>
      <button id="btnLogout">Sair</button>
    </div>
  `;

  document.getElementById("btnLogout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    atualizarUsuarioLogado();
    window.location.href = "index.html";
  });
}

supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user;

  if (!user) {
    containerUser.style.display = "none";
    containerUser.innerHTML = "";
  } else {
    atualizarUsuarioLogado();
  }
});



