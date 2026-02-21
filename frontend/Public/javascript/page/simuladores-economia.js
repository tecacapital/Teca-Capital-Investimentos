// script.js
document.addEventListener('DOMContentLoaded', function() {
    // 1. Formatação de moeda (REGRA #8)
    function formatKwanza(valor) {
        return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Kz';
    }

    // Aplicar formatação a todos os elementos com preço
    const precoElements = document.querySelectorAll('.hero-meta, .cta-card h2, .hero-meta i + span');
    precoElements.forEach(el => {
        if (el.textContent.includes('7500') || el.textContent.includes('7.500')) {
            el.textContent = el.textContent.replace(/\d+[\.]?\d* Kz/, formatKwanza(7500));
        }
    });

    // 2. Scroll suave para âncoras (caso existam links internos)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 3. Interatividade nos feedbacks (hover sutis e tooltips opcionais)
    const feedbackCards = document.querySelectorAll('.feedback-card');
    feedbackCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-6px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // 4. Tooltips simples para indicadores (opcional)
    const indicadores = document.querySelectorAll('.card-animated .card-header');
    indicadores.forEach(header => {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip-dica';
        tooltip.textContent = '‣ detalhe';
        tooltip.style.cssText = 'font-size:0.8rem; color:var(--primary-gold); margin-left:8px; opacity:0.7; cursor:help;';
        header.appendChild(tooltip);

        const indicadorNome = header.innerText.split('‣')[0].trim();
        let mensagem = '';
        if (indicadorNome.includes('PIB')) mensagem = 'Recessão técnica: 2 trimestres negativos';
        else if (indicadorNome.includes('Inflação')) mensagem = 'Hiper >50% ao mês';
        else if (indicadorNome.includes('Desemprego')) mensagem = 'Dois dígitos = crise social';
        else if (indicadorNome.includes('Juro')) mensagem = 'Taxas altas asfixiam consumo';
        else mensagem = 'fonte: FMI / Banco Mundial';

        tooltip.addEventListener('mouseenter', () => {
            const dica = document.createElement('div');
            dica.className = 'tooltip-flutuante';
            dica.textContent = mensagem;
            dica.style.cssText = 'position:absolute; background:black; border:1px solid gold; color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; z-index:100; white-space:nowrap; transform:translateY(-30px);';
            header.style.position = 'relative';
            header.appendChild(dica);
            setTimeout(() => dica.remove(), 2000);
        });
    });

    // 5. Efeito nas bordas animadas já estão no CSS, mas podemos acelerar um pouco no hover com JS (opcional)
    const allCards = document.querySelectorAll('.card-animated');
    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.2s ease';
        });
    });

    // 6. Garantir que todos os ícones tenham cor dourada (fallback)
    document.querySelectorAll('i[class*="fa-"]').forEach(icon => {
        if (!icon.style.color && !icon.classList.contains('gold-icon')) {
            // se não tiver gold explícito e não for o ícone específico de seta (mantém herança)
            if (!icon.classList.contains('fa-arrow-right') && !icon.closest('.btn-primary')) {
                icon.style.color = 'rgb(214, 174, 100)';
            }
        }
    });

    // 7. Atualizar dinamicamente ano ou algo do tipo (apenas para manter consistência)
    console.log('Simulador de Economia · TECA CAPITAL carregado com bordas animadas e ícones dourados.');
});