// src/app/services/notificacao.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Notificacao, ConfiguracoesAlerta, TipoNotificacao } from '../model/notificacao.model';
import { PlantaUsuario } from '../model/planta-usuario.model';

const KEY_LIDAS = 'biogrow_notificacoes_lidas';
const KEY_CONFIG = 'biogrow_config_alertas';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {

  private notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  public notificacoes$ = this.notificacoesSubject.asObservable();

  private configSubject = new BehaviorSubject<ConfiguracoesAlerta>(this.carregarConfig());
  public config$ = this.configSubject.asObservable();

  constructor() {}

  // ============ CONFIGURAÇÕES ============
  get config(): ConfiguracoesAlerta {
    return this.configSubject.value;
  }

  private carregarConfig(): ConfiguracoesAlerta {
    const salvo = localStorage.getItem(KEY_CONFIG);
    if (!salvo) return new ConfiguracoesAlerta();
    try {
      return new ConfiguracoesAlerta(JSON.parse(salvo));
    } catch {
      return new ConfiguracoesAlerta();
    }
  }

  salvarConfig(config: ConfiguracoesAlerta) {
    localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
    this.configSubject.next(config);
  }

  atualizarConfig(parcial: Partial<ConfiguracoesAlerta>) {
    const nova = new ConfiguracoesAlerta({ ...this.config, ...parcial });
    this.salvarConfig(nova);
  }

  // ============ NOTIFICAÇÕES LIDAS ============
  private carregarLidas(): Set<string> {
    const salvo = localStorage.getItem(KEY_LIDAS);
    if (!salvo) return new Set();
    try {
      return new Set(JSON.parse(salvo));
    } catch {
      return new Set();
    }
  }

  private salvarLidas(ids: Set<string>) {
    localStorage.setItem(KEY_LIDAS, JSON.stringify(Array.from(ids)));
  }

  marcarComoLida(id: string) {
    const lidas = this.carregarLidas();
    lidas.add(id);
    this.salvarLidas(lidas);

    const atual = this.notificacoesSubject.value.map(n =>
      n.id === id ? { ...n, lida: true } : n
    );
    this.notificacoesSubject.next(atual);
  }

  marcarTodasComoLidas() {
    const atual = this.notificacoesSubject.value;
    const lidas = this.carregarLidas();
    atual.forEach(n => lidas.add(n.id));
    this.salvarLidas(lidas);

    this.notificacoesSubject.next(atual.map(n => ({ ...n, lida: true })));
  }

  limparNotificacao(id: string) {
    const atual = this.notificacoesSubject.value.filter(n => n.id !== id);
    this.notificacoesSubject.next(atual);

    const lidas = this.carregarLidas();
    lidas.add(id);
    this.salvarLidas(lidas);
  }

  // ============ GERAR NOTIFICAÇÕES ============
  gerarNotificacoes(
    plantas: PlantaUsuario[],
    atividades: any[],
    streak: number
  ): Notificacao[] {
    const lidas = this.carregarLidas();
    const config = this.config;
    const notificacoes: Notificacao[] = [];

    // 1) Alertas de planta
    if (config.alertasPlanta) {
      plantas.forEach(p => {
        if ((p.saude ?? 100) < 40) {
          notificacoes.push(this.criar(
            `planta-saude-${p.id}`,
            'planta',
            `🚨 ${p.apelido} precisa de cuidados!`,
            `Saúde crítica: ${p.saude}%. Cuide agora pra não perder a planta.`,
            true,
            lidas
          ));
        } else if ((p.felicidade ?? 100) < 30) {
          notificacoes.push(this.criar(
            `planta-felicidade-${p.id}`,
            'planta',
            `${p.apelido} está triste 😢`,
            `Felicidade baixa: ${p.felicidade}%. Que tal dar uma atenção?`,
            false,
            lidas
          ));
        }
      });
    }

    // 2) Evolução da planta
    if (config.evolucaoPlanta) {
      plantas.forEach(p => {
        if ((p.nivel || 1) >= 2) {
          notificacoes.push(this.criar(
            `planta-evoluiu-${p.id}`,
            'planta',
            `${p.apelido} evoluiu! 🌱`,
            `Sua planta alcançou o nível ${p.nivel}. Continue cuidando bem dela.`,
            false,
            lidas
          ));
        }
      });
    }

    // 3) Prazos de atividades
    if (config.prazosAtividades) {
      const hoje = new Date();
      atividades.forEach(a => {
        if (a.status === 'CONCLUIDA' || a.status === 'FECHADA') return;
        const entrega = new Date(a.dataEntrega);
        const dias = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (dias < 0) {
          notificacoes.push(this.criar(
            `atividade-atrasada-${a.id}`,
            'alerta',
            `⚠️ "${a.titulo}" está atrasada!`,
            `Prazo era ${entrega.toLocaleDateString('pt-BR')}. Entregue o quanto antes.`,
            true,
            lidas
          ));
        } else if (dias <= 2) {
          notificacoes.push(this.criar(
            `atividade-prazo-${a.id}`,
            'alerta',
            `⏰ "${a.titulo}" vence em ${dias} dia${dias === 1 ? '' : 's'}!`,
            `Não perca o prazo: ${entrega.toLocaleDateString('pt-BR')}.`,
            dias === 0,
            lidas
          ));
        }
      });
    }

    // 4) Conquistas
    if (streak >= 7) {
      notificacoes.push(this.criar(
        'conquista-streak-7',
        'conquista',
        '🏆 Nova conquista desbloqueada!',
        `Você atingiu ${streak} dias consecutivos de estudo!`,
        false,
        lidas
      ));
    }

    return notificacoes.sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      return b.dataCriacao.getTime() - a.dataCriacao.getTime();
    });
  }

  private criar(
    id: string,
    tipo: TipoNotificacao,
    titulo: string,
    descricao: string,
    urgente: boolean,
    lidas: Set<string>
  ): Notificacao {
    return new Notificacao(
      id,
      tipo,
      titulo,
      descricao,
      urgente,
      lidas.has(id),
      new Date()
    );
  }

  setNotificacoes(lista: Notificacao[]) {
    this.notificacoesSubject.next(lista);
  }
}