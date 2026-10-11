import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { PlantaUsuarioService } from '../../services/planta-usuario';
import { RegistroService } from '../../services/registro';
import { FaseService } from '../../services/fase.service';
import { EspecieService } from '../../services/especie.service';
import { AuthService } from '../../core/services/auth.service';
import { PlantaUsuario } from '../../model/planta-usuario.model';
import { Registro } from '../../model/registro.model';
import { FasePlanta } from '../../model/fase-planta.model';
import { PlantaVisualComponent } from '../../components/planta-visual/planta-visual.component';
import { addIcons } from 'ionicons';
import { 
  arrowForwardOutline, checkmarkOutline, sparklesOutline, sunnyOutline, 
  heartOutline, fitnessOutline, flashOutline, leafOutline, waterOutline, 
  happyOutline, ellipseOutline, sadOutline, shieldCheckmarkOutline, 
  moonOutline, partlySunnyOutline, alertCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-cuidados-planta',
  templateUrl: './cuidados-planta.page.html',
  styleUrls: ['./cuidados-planta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, PlantaVisualComponent]
})
export class CuidadosPlantaPage implements OnInit {
  plantaId: number = 0;
  planta: PlantaUsuario | null = null;
  fase: FasePlanta | null = null;
  fasesEspecie: FasePlanta[] = [];
  totalFasesEspecie: number = 1;
  ambienteEspecie: string = 'Externo';

  // Status
  loading: boolean = true;
  cuidando: boolean = false;
  cuidadoAnimado: boolean = false;
  evolucaoAnimada: boolean = false;
  faseAnteriorId: number | null = null;
  faseAnteriorNome = '';
  faseNovaNome = '';
  evolucaoEsperada = false;

  // Histórico
  historico: Registro[] = [];
  carregandoHistorico: boolean = false;
  private movimentoRecente: { anterior: string; nova: string } | null = null;
  salvandoEvolucao: boolean = false;

  // Feedback
  feedback: {
    xpPlanta: number;
    xpUsuario: number;
    mensagem: string;
    evoluiu: boolean;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plantaService: PlantaUsuarioService,
    private registroService: RegistroService,
    private faseService: FaseService,
    private especieService: EspecieService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ 
      arrowForwardOutline, checkmarkOutline, sparklesOutline, sunnyOutline, 
      heartOutline, fitnessOutline, flashOutline, leafOutline, waterOutline, 
      happyOutline, ellipseOutline, sadOutline,
      shieldCheckmarkOutline, moonOutline, partlySunnyOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.inicializarRota();
  }

  ionViewWillEnter() {
    this.inicializarRota();
  }

  private inicializarRota() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const plantaId = Number.parseInt(id, 10);
      if (Number.isFinite(plantaId) && plantaId > 0) {
        this.plantaId = plantaId;
        try {
          localStorage.setItem('grow:ultima-planta', String(this.plantaId));
        } catch {}
        this.carregarDados();
      } else {
        this.router.navigate(['/minhas-plantas']);
      }
    } else {
      this.router.navigate(['/minhas-plantas']);
    }
  }

  carregarDados() {
    this.loading = true;
    this.plantaService.buscarPorId(this.plantaId).subscribe({
      next: (planta) => {
        this.planta = planta;
        if (planta.especieId) {
          this.especieService.buscarPorId(planta.especieId).subscribe({
            next: (especie) => {
              this.ambienteEspecie = especie.ambiente || 'Externo';
            },
            error: () => {
              this.ambienteEspecie = 'Externo';
            }
          });
        }
        this.carregarFase(planta.faseId);
        this.carregarHistorico();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Não foi possível carregar os dados da planta.';
        this.mostrarAlerta('Erro', msg);
        this.router.navigate(['/minhas-plantas']);
      }
    });
  }

  carregarFase(faseId: number) {
    if (!faseId) {
      this.loading = false;
      return;
    }
    this.faseService.buscarPorId(faseId).subscribe({
      next: (fase) => {
        this.fase = fase;
        const especieId = this.planta?.especieId;
        if (especieId) {
          this.faseService.listarPorEspecie(especieId).subscribe({
            next: (fases) => {
              this.fasesEspecie = [...fases].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
              this.totalFasesEspecie = this.fasesEspecie.length || 1;
              this.verificarEvolucao();
            },
            error: () => { this.totalFasesEspecie = 1; }
          });
        }
        if (this.evolucaoEsperada && this.faseAnteriorId !== null && fase.id !== this.faseAnteriorId) {
          this.faseNovaNome = fase.nome || `Fase ${fase.ordem}`;
          this.iniciarAnimacaoEvolucao();
          this.evolucaoEsperada = false;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  carregarHistorico() {
    if (!this.plantaId) return;
    this.carregandoHistorico = true;
    this.registroService.listarPorPlanta(this.plantaId).subscribe({
      next: (registros: any[]) => {
        this.historico = (registros || [])
          .sort((a, b) => {
            const dataA = new Date(a.dataRegistro || a.dataHora || a.criadoEm || a.data || 0).getTime();
            const dataB = new Date(b.dataRegistro || b.dataHora || b.criadoEm || b.data || 0).getTime();
            return dataB - dataA;
          })
          .slice(0, 5);

        this.aplicarMovimentosSalvos();

        if (this.movimentoRecente) {
          const movimento = this.historico.find(reg => this.getTipoAcaoRegistro(reg) === 'MOVER') as any;
          if (movimento) {
            movimento.posicaoAnterior = movimento.posicaoAnterior ?? this.movimentoRecente.anterior;
            movimento.posicaoNova = movimento.posicaoNova ?? this.movimentoRecente.nova;
            if (movimento.id) {
              localStorage.setItem(`grow:movimento-registro:${movimento.id}`, JSON.stringify({
                anterior: movimento.posicaoAnterior,
                nova: movimento.posicaoNova
              }));
            }
          }
          this.movimentoRecente = null;
        }
        this.carregandoHistorico = false;
      },
      error: () => {
        this.carregandoHistorico = false;
        this.historico = [];
      }
    });
  }

  regar() {
    if (!this.planta || this.cuidando || !this.podeRegar()) return;
    this.executarAcao('regar');
  }

  adubar() {
    if (!this.planta || this.cuidando || !this.podeAdubar()) return;
    this.executarAcao('adubar');
  }

  podeRegar(): boolean {
    return !this.planta?.ultimaRega || this.passouUmDia(this.planta.ultimaRega);
  }

  podeAdubar(): boolean {
    return !this.planta?.ultimaAdubacao || this.passouSeteDias(this.planta.ultimaAdubacao);
  }

  private passouUmDia(data: string): boolean {
    return Date.now() - new Date(data).getTime() >= 24 * 60 * 60 * 1000;
  }

  private passouSeteDias(data: string): boolean {
    return Date.now() - new Date(data).getTime() >= 7 * 24 * 60 * 60 * 1000;
  }

  moverPara(posicao: string) {
    if (!this.planta || this.cuidando || this.planta.posicaoAtual === posicao) return;
    this.executarAcao('mover', posicao);
  }

  private executarAcao(acao: 'regar' | 'adubar' | 'mover', posicao?: string) {
  if (!this.planta?.id) return;

  if (acao === 'mover' && posicao) {
    this.movimentoRecente = {
      anterior: this.planta.posicaoAtual,
      nova: posicao
    };
  }

  this.cuidando = true;
  this.feedback = null;
  this.cuidadoAnimado = false;
  this.evolucaoAnimada = false;
  this.faseAnteriorId = this.fase?.id ?? this.planta.faseId;
  this.faseAnteriorNome = this.fase?.nome || `Fase ${this.planta.faseId}`;

  let obs$;

  if (acao === 'regar') {
    obs$ = this.plantaService.regar(this.planta.id);
  } else if (acao === 'adubar') {
    obs$ = this.plantaService.adubar(this.planta.id);
  } else {
    obs$ = this.plantaService.mover(this.planta.id, posicao!);
  }

  obs$.subscribe({
    next: (response: any) => {
      this.cuidando = false;
      this.evolucaoEsperada = true;

      const plantaResposta = response?.planta || (response?.id ? response : null);
      if (plantaResposta && this.faseAnteriorId !== null && plantaResposta.faseId !== this.faseAnteriorId) {
        const plantaEvoluida = { ...plantaResposta, xpAtual: 0 } as PlantaUsuario;
        this.salvarEvolucao(plantaEvoluida);
        if (response?.planta) {
          response = { ...response, planta: plantaEvoluida };
        } else {
          response = plantaEvoluida;
        }
      }

      // O backend agora devolve a planta diretamente (não envelopada em { planta: ... })
      if (response && (response.id || response.posicaoAtual)) {
        this.atualizarPlanta(response, !plantaResposta || plantaResposta.faseId === this.faseAnteriorId);
      } else if (response && response.planta) {
        this.atualizarPlanta(response.planta, !plantaResposta || plantaResposta.faseId === this.faseAnteriorId);
      } else {
        this.recarregarPlanta();
      }

      this.verificarEvolucao();

      this.mostrarFeedback(response);
    },
error: (err: any) => {
  this.cuidando = false;
  this.movimentoRecente = null;
  
  // Verifica se o erro veio como texto plano (string) ou objeto JSON
  let msg = 'Erro ao executar ação. Tente novamente.';
  if (typeof err.error === 'string') {
    msg = err.error;
  } else if (err.error?.message) {
    msg = err.error.message;
  }

  this.mostrarAlerta('Atenção', msg);
}
  });
}

  atualizarPlanta(plantaAtualizada: PlantaUsuario, recarregarDados = true) {
    this.planta = { ...plantaAtualizada };
    if (plantaAtualizada.faseId) {
      this.carregarFase(plantaAtualizada.faseId);
    }
    if (recarregarDados) {
      this.carregarHistorico();
    }
    this.authService.atualizarUsuario();
  }

  recarregarPlanta() {
    this.plantaService.buscarPorId(this.plantaId).subscribe({
      next: (planta) => {
        this.planta = planta;
        this.carregarHistorico();
        this.carregarFase(planta.faseId);
      },
      error: () => {
        this.mostrarAlerta('Erro', 'Não foi possível recarregar os dados da planta.');
      }
    });
  }

  private verificarEvolucao() {
    if (!this.planta || !this.fase || !this.fasesEspecie.length) return;
    if (this.faseAnteriorId !== null && this.planta.faseId !== this.faseAnteriorId) return;
    const proximaFase = this.fasesEspecie.find(item => (item.ordem || 0) > (this.fase?.ordem || 0));
    if (!proximaFase?.id || (this.planta.xpAtual || 0) < (this.fase.xpNecessario || Number.MAX_SAFE_INTEGER)) {
      return;
    }

    const faseAnterior = this.fase;
    this.planta = { ...this.planta, faseId: proximaFase.id, xpAtual: 0 };
    this.fase = proximaFase;
    this.faseAnteriorNome = faseAnterior.nome || `Fase ${faseAnterior.ordem}`;
    this.faseNovaNome = proximaFase.nome || `Fase ${proximaFase.ordem}`;
    this.iniciarAnimacaoEvolucao();

    this.plantaService.atualizar(this.planta.id, this.planta).subscribe({
      error: () => {
        this.recarregarPlanta();
      }
    });
  }

  private salvarEvolucao(plantaAtualizada: PlantaUsuario) {
    this.salvandoEvolucao = true;
    this.plantaService.atualizar(plantaAtualizada.id, plantaAtualizada).subscribe({
      next: () => {
        this.salvandoEvolucao = false;
      },
      error: () => {
        this.salvandoEvolucao = false;
        this.recarregarPlanta();
      }
    });
  }

  mostrarFeedback(response: any) {
    if (!response) return;

    let mensagem = 'Cuidado realizado com sucesso!';
    let xpPlanta = 0;
    let xpUsuario = 0;
    let evoluiu = false;

    if (response.mensagem) mensagem = response.mensagem;
    if (response.xpPlantaGanho !== undefined) xpPlanta = response.xpPlantaGanho;
    if (response.xpUsuarioGanho !== undefined) xpUsuario = response.xpUsuarioGanho;
    if (response.evoluiu !== undefined) evoluiu = response.evoluiu;

    const usuario = this.authService.currentUser;
    if (usuario && usuario.id) {
      if (response.xpTotalUsuario !== undefined || response.novoNivelUsuario !== undefined) {
        this.authService.atualizarEstadoUsuarioLocal({
          xpTotal: response.xpTotalUsuario,
          nivelUsuario: response.novoNivelUsuario
        });
      } else {
        this.authService.atualizarUsuario(usuario.id).subscribe();
      }
    }

    this.feedback = { xpPlanta, xpUsuario, mensagem, evoluiu };
    this.cuidadoAnimado = true;
    if (response.planta?.faseId && response.planta.faseId !== this.faseAnteriorId) {
      this.faseNovaNome = response.planta.faseNome || `Fase ${response.planta.faseId}`;
      this.iniciarAnimacaoEvolucao();
      this.evolucaoEsperada = false;
    }
    this.mostrarFeedbackToast();
  }

  iniciarAnimacaoEvolucao() {
    this.evolucaoAnimada = true;
    window.setTimeout(() => {
      this.evolucaoAnimada = false;
    }, 4200);
  }

  getStatusIcon(planta: PlantaUsuario): string {
    const saude = planta.saude ?? 100;
    if (saude >= 80) return 'happy-outline';
    if (saude >= 50) return 'ellipse-outline';
    return 'sad-outline';
  }

  getEstagioVisual(): number {
    if (!this.fase) return 1;
    const faseAtual = this.fase.ordem || 1;
    const total = this.totalFasesEspecie || 1;
    const estagio = Math.ceil((faseAtual / total) * 5);
    return Math.min(5, Math.max(1, estagio));
  }

  getNivelSaude(p: any): 'alta' | 'media' | 'baixa' | 'critica' {
    const saude = p?.saude ?? 100;
    if (saude >= 80) return 'alta';
    if (saude >= 50) return 'media';
    if (saude >= 20) return 'baixa';
    return 'critica';
  }

  getNivelAgua(p: any): 'seca' | 'ideal' | 'encharcada' {
    const agua = p?.aguaAtual ?? 50;
    if (agua < 30) return 'seca';
    if (agua > 80) return 'encharcada';
    return 'ideal';
  }

  getNivelFelicidade(p: any): 'feliz' | 'neutra' | 'triste' {
    const estresse = p?.estresse ?? 0;
    if (estresse <= 30) return 'feliz';
    if (estresse <= 60) return 'neutra';
    return 'triste';
  }

  getNivelNutrientes(p: any): 'baixo' | 'ideal' | 'alto' {
    const n = p?.nutrientesAtual ?? 50;
    if (n < 30) return 'baixo';
    if (n > 80) return 'alto';
    return 'ideal';
  }

  getNivelLuz(p: any): 'baixa' | 'ideal' | 'alta' {
    const l = p?.luzAtual ?? 50;
    if (l < 30) return 'baixa';
    if (l > 80) return 'alta';
    return 'ideal';
  }

  getLabelAgua(p: any): string {
    const nivel = this.getNivelAgua(p);
    if (nivel === 'seca') return 'Solo seco';
    if (nivel === 'encharcada') return 'Solo encharcado';
    return 'Solo úmido';
  }

  getLabelNutrientes(p: any): string {
    const nivel = this.getNivelNutrientes(p);
    if (nivel === 'baixo') return 'Baixo';
    if (nivel === 'alto') return 'Alto';
    return 'Ideal';
  }

  getLabelLuz(p: any): string {
    const nivel = this.getNivelLuz(p);
    if (nivel === 'baixa') return 'Baixa';
    if (nivel === 'alta') return 'Alta';
    return 'Ideal';
  }

  getCorNivel(nivel: string): string {
    if (nivel === 'seca' || nivel === 'baixo' || nivel === 'baixa') return '#E57373';
    if (nivel === 'encharcada' || nivel === 'alto' || nivel === 'alta') return '#F5A623';
    return '#2D6A4F';
  }

  getCorSaudeStatus(): string {
    return '#9B1C1C';
  }

  getCorEstresseStatus(): string {
    return '#6B7280';
  }

  getIconeAcao(tipo: string): string {
    if (tipo === 'REGAR') return '💧';
    if (tipo === 'ADUBAR') return '🌱';
    if (tipo === 'MOVER') return '☀️';
    return '📝';
  }

  getLabelAcao(tipo: string): string {
    if (tipo === 'REGAR') return 'Regou';
    if (tipo === 'ADUBAR') return 'Adubou';
    if (tipo === 'MOVER') return 'Moveu';
    return tipo;
  }

  getDescricaoMovimento(reg: any): string {
    const origem = reg?.posicaoAnterior ?? reg?.posicaoOrigem ?? reg?.valorAnterior;
    const destino = reg?.posicaoNova ?? reg?.posicaoDestino ?? reg?.valorNovo;
    if (origem == null || destino == null || (typeof origem === 'number' && origem === destino)) {
      return 'Moveu';
    }

    const de = this.getNomePosicao(origem);
    const para = this.getNomePosicao(destino);
    const artigoDe = de === 'Sol Pleno' ? 'do' : 'da';
    const artigoPara = para === 'Sol Pleno' ? 'para o' : 'para a';
    return `Moveu ${artigoDe} ${de} ${artigoPara} ${para}`;
  }

  private aplicarMovimentosSalvos() {
    this.historico = this.historico.map(registro => {
      if (this.getTipoAcaoRegistro(registro) !== 'MOVER' || !registro.id) {
        return registro;
      }

      const movimento = this.getMovimentoSalvo(registro.id);
      if (!movimento) {
        return registro;
      }

      return {
        ...registro,
        posicaoAnterior: registro.posicaoAnterior ?? movimento.anterior,
        posicaoNova: registro.posicaoNova ?? movimento.nova
      } as Registro;
    });
  }

  private getMovimentoSalvo(registroId: number): { anterior: string; nova: string } | null {
    try {
      const valor = localStorage.getItem(`grow:movimento-registro:${registroId}`);
      return valor ? JSON.parse(valor) : null;
    } catch {
      return null;
    }
  }

  private getNomePosicao(posicao: string | number | null | undefined): string {
    if (posicao === 'SOMBRA' || Number(posicao) === 0) return 'Sombra';
    if (posicao === 'SOL_PLENO' || Number(posicao) >= 80) return 'Sol Pleno';
    return 'Meia-sombra';
  }

  getStatusColor(planta: PlantaUsuario): string {
    const saude = planta.saude ?? 100;
    if (saude >= 80) return '#2D6A4F';
    if (saude >= 50) return '#F5A623';
    return '#d4183d';
  }

  getSaudeLabel(planta: PlantaUsuario): string {
    const saude = planta.saude ?? 100;
    if (saude >= 80) return 'Bom';
    if (saude >= 50) return 'Médio';
    return 'Crítico';
  }

  getSaudeColor(planta: PlantaUsuario): string {
    const saude = planta.saude ?? 100;
    if (saude >= 80) return '#2D6A4F';
    if (saude >= 50) return '#F5A623';
    return '#d4183d';
  }

  getEstresseColor(planta: PlantaUsuario): string {
    const estresse = planta.estresse ?? 0;
    if (estresse <= 30) return '#2D6A4F';
    if (estresse <= 60) return '#F5A623';
    return '#d4183d';
  }

  getProgressoXP(): number {
    if (!this.planta || !this.fase) return 0;
    const xp = this.planta.xpAtual || 0;
    const max = this.fase.xpNecessario || 1;
    return Math.min((xp / max) * 100, 100);
  }

  getXpTexto(): string {
    if (!this.planta || !this.fase) return '0 / 0 XP';
    return `${this.planta.xpAtual || 0} / ${this.fase.xpNecessario || 0} XP`;
  }

  getTempoRelativo(reg: any): string {
    const date = typeof reg === 'object' 
      ? (reg?.dataRegistro || reg?.dataHora || reg?.criadoEm || reg?.data) 
      : reg;

    if (!date) return 'Recente';
    const agora = new Date();
    const data = new Date(date);
    if (isNaN(data.getTime())) return 'Recente';

    const diff = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    return data.toLocaleDateString('pt-BR');
  }

  getXpRegistro(reg: any): number {
    return reg?.xpRecebido ?? reg?.xpGanho ?? reg?.xp ?? 0;
  }

  getTipoAcaoRegistro(reg: any): string {
    return String(reg?.tipoAcao || reg?.tipoCuidado || '').trim().toUpperCase();
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarFeedbackToast() {
    if (!this.feedback) return;
    const mensagem = this.feedback.mensagem || 'Cuidado realizado!';
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 4000,
      color: this.feedback.evoluiu ? 'success' : 'primary',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  voltar() {
    this.router.navigate(['/minhas-plantas']);
  }

  getAmbienteArquivo(): string {
    const map: Record<string, string> = {
      'Interno': 'fundo-interno',
      'Externo': 'fundo-externo',
      'Misto': 'fundo-misto',
      'Aquático': 'fundo-aquatico',
      'Aquatico': 'fundo-aquatico',
      'Desértico': 'fundo-desertico',
      'Desertico': 'fundo-desertico',
      'Tropical': 'fundo-tropical',
      'Temperado': 'fundo-temperado'
    };
    return map[this.ambienteEspecie] || 'fundo-externo';
  }

  getFundoUrl(): string {
    return `url('/assets/cenarios/${this.getAmbienteArquivo()}.jpg')`;
  }

  getFundoPosicao(): string {
    if (this.ambienteEspecie === 'Aquático' || this.ambienteEspecie === 'Aquatico') {
      return 'center bottom';
    }
    if (this.ambienteEspecie === 'Misto' || this.ambienteEspecie === 'Tropical') {
      return 'center 80%';
    }
    if (this.ambienteEspecie === 'Interno' || this.ambienteEspecie === 'Temperado') {
      return 'center bottom';
    }
    return 'center center';
  }
}