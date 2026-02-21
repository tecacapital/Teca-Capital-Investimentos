        (function() {
            // 1) formatador de kwanzas
            function formatKwanza(valor) {
                return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Kz';
            }
            // aplicar em todos os badges com números fixos (já está no html, mas deixamos função)

            // 2) Accordion FAQ
            function setupAccordion() {
                const questions = document.querySelectorAll('.faq-question');
                questions.forEach(question => {
                    question.addEventListener('click', function(e) {
                        const expanded = this.getAttribute('aria-expanded') === 'true';
                        // fechar outros
                        if (!expanded) {
                            questions.forEach(q => {
                                if (q !== this) {
                                    q.setAttribute('aria-expanded', 'false');
                                    const otherAnswer = q.nextElementSibling;
                                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                                }
                            });
                        }
                        this.setAttribute('aria-expanded', !expanded);
                        const answer = this.nextElementSibling;
                        if (answer) {
                            answer.style.maxHeight = expanded ? null : answer.scrollHeight + 'px';
                        }
                    });
                    // tecla Enter
                    question.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            question.click();
                        }
                    });
                });
            }

            // 3) suave scroll para âncoras (opcional)
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (href === '#') return;
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });

            // 4) pequeno efeito hover nas bordas já feito no CSS, mas garantimos anim ativa
            // as bordas já estão com classe animated-border

            // 5) verificar se tabelas estão perfeitas (já estão)
            setupAccordion();

            // 6) aplicar formatação em eventual elemento dinâmico (não necessário, mas exemplar)
            // apenas para demonstrar que a função existe
            console.log('Preço exemplo: ' + formatKwanza(70000));
        })();
    


  
 
   
    