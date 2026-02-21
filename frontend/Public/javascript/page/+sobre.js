        (function() {
            // 1. formatação de moeda (REGRA #8) - função formatKwanza
            function formatKwanza(valor) {
                if (typeof valor !== 'number') valor = Number(valor) || 0;
                return valor.toLocaleString('pt-AO').replace(/,/g, '.') + ' Kz';
            }
            // exemplo: se quiséssemos atualizar via js, mas já está estático no HTML.
            // pode-se garantir que o elemento com id="faturamentoObj" tenha o valor correto.
            const fatEl = document.getElementById('faturamentoObj');
            if (fatEl) {
                // já está com '50.000.000 Kz' no HTML, mas garantimos a formatação via js também
                // apenas para demonstrar a função, sem alterar visual.
                // não altera pois já está correto.
            }

            // 2. efeitos hover já no CSS
            // 3. scroll suave para âncoras internas (caso existam links internos futuros)
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if(target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });

            // 4. tooltips simples? opcional: podemos adicionar data-tooltip em alguns spans, mas fica como extra
            // 5. accordion não necessário, tudo já visível.
        })();
   