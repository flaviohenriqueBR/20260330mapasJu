
//
// ==============================
// CONFIGURAÇÃO GLOBAL
// ==============================
//

let breaks = [];
let cores = [];
let numClasses = 5;
let paletaAtual = "YlGnBu";

let mapa;
let camadaGeojson;

let cidadeAtual = "americana";

const indicadoresDisponiveis = [
    "moradores",
"perc_mulheres",
"perc_jovens",
"renda_media",
"1212_DEPUTADO_FEDERAL",
"13133_DEPUTADO_ESTADUAL",
"1313_DEPUTADO_FEDERAL",
"1319_DEPUTADO_FEDERAL",
"13900_DEPUTADO_ESTADUAL",
"13_DEPUTADO_ESTADUAL",
"13_DEPUTADO_FEDERAL",
"1818_DEPUTADO_FEDERAL",
"4040_DEPUTADO_FEDERAL",
"50000_DEPUTADO_ESTADUAL",
"50005_DEPUTADO_ESTADUAL",
"5000_DEPUTADO_FEDERAL",
"5010_DEPUTADO_FEDERAL",
"50110_DEPUTADO_ESTADUAL",
"5021_DEPUTADO_FEDERAL",
"50789_DEPUTADO_ESTADUAL",
"5089_DEPUTADO_FEDERAL",
"50_DEPUTADO_ESTADUAL",
"50_DEPUTADO_FEDERAL"
];

let indicadorAtual = indicadoresDisponiveis[0];

let dadosGeo = null;

//
// ==============================
// MAPA
// ==============================
//

function iniciarMapa() {

    mapa = L.map("map").setView([-22.73, -47.33], 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(mapa);

}

//
// ==============================
// CARREGAR GEOJSON
// ==============================
//

async function carregarGeojson() {

    const resposta = await fetch(`data/${cidadeAtual}.geojson`);

    dadosGeo = await resposta.json();

    desenharMapa();

}

//
// ==============================
// JENKS
// ==============================
//

function calcularJenks(valores, n) {
    return ss.jenks(valores, n);
}

//
// ==============================
// CORES
// ==============================
//

function gerarCores(n) {
    return chroma.scale(paletaAtual).colors(n);
}

function getCor(valor) {

    if (valor === null || valor === undefined) return "#ccc";

    for (let i = 0; i < breaks.length - 1; i++) {

        if (valor >= breaks[i] && valor <= breaks[i + 1]) {
            return cores[i];
        }

    }

    return cores[cores.length - 1];

}

//
// ==============================
// DESENHAR MAPA
// ==============================
//

function desenharMapa() {

    if (camadaGeojson) {
        mapa.removeLayer(camadaGeojson);
    }

    const valores = dadosGeo.features
        .map(f => f.properties[indicadorAtual])
        .filter(v => v !== null && v !== undefined);

    breaks = calcularJenks(valores, numClasses);
    cores = gerarCores(numClasses);

    camadaGeojson = L.geoJSON(dadosGeo, {

        style: function (feature) {

            const valor = feature.properties[indicadorAtual];

            return {
                color: "#555",
                weight: 1,
                fillOpacity: 0.7,
                fillColor: getCor(valor)
            };

        },

        onEachFeature: function (feature, layer) {

            layer.bindPopup(`
                <b>${feature.properties.NM_LOCAL_VOTACAO || "Local"}</b><br>
                ${indicadorAtual}: ${feature.properties[indicadorAtual]}
            `);

        }

    }).addTo(mapa);

    criarLegenda();

}

//
// ==============================
// LEGENDA
// ==============================
//

function criarLegenda() {

    const old = document.getElementById("legend");
    if (old) old.remove();

    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {

        let div = L.DomUtil.create("div", "info legend");
        div.id = "legend";

        for (let i = 0; i < breaks.length - 1; i++) {

            div.innerHTML += `
                <div>
                    <i style="background:${cores[i]}"></i>
                   ${breaks[i].toFixed(3)} – ${breaks[i + 1].toFixed(3)}
                </div>
            `;

        }

        return div;

    };

    legend.addTo(mapa);

}

//
// ==============================
// INDICADORES (DINÂMICO)
// ==============================
//

function carregarIndicadores() {

    const select = document.getElementById("indicador");

    select.innerHTML = "";

    indicadoresDisponiveis.forEach(ind => {

        const opt = document.createElement("option");
        opt.value = ind;
        opt.textContent = ind;

        select.appendChild(opt);

    });

    indicadorAtual = indicadoresDisponiveis[0];
}

//
// ==============================
// INIT GERAL
// ==============================
//

document.addEventListener("DOMContentLoaded", function () {

    iniciarMapa();
    carregarIndicadores();
    carregarGeojson();

    document.getElementById("indicador").addEventListener("change", function (e) {
        indicadorAtual = e.target.value;
        desenharMapa();
    });

    document.getElementById("cidade").addEventListener("change", function (e) {
        cidadeAtual = e.target.value;
        carregarGeojson();
    });

    document.getElementById("classes").addEventListener("change", function (e) {
        numClasses = +e.target.value;
        desenharMapa();
    });

    document.getElementById("paleta").addEventListener("change", function (e) {
        paletaAtual = e.target.value;
        desenharMapa();
    });

});