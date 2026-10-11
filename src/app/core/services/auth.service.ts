import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Usuario } from '../../model/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private getStoredUser(): Usuario | null {
    const userJson = localStorage.getItem('usuario');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  get currentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Envia as credenciais ao endpoint /api/auth/login do Spring Boot
   */
  login(email: string, senha: string): Observable<any> {
    console.log('📡 AuthService.login() chamado com email:', email);

    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, senha }).pipe(
      tap((res) => {
        console.log('✅ Resposta do backend no login:', res);

        const tokenRecebido = res?.token || (typeof res === 'string' ? res : null);

        if (tokenRecebido) {
          localStorage.setItem('token', tokenRecebido);
          this.tokenSubject.next(tokenRecebido);
          console.log('💾 Token salvo com sucesso no localStorage:', tokenRecebido);
        } else {
          console.warn('⚠️ A propriedade token não veio na resposta do login:', res);
        }

        if (res?.usuario) {
          this.currentUserSubject.next(res.usuario);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          console.log('👤 Usuário armazenado no estado global:', res.usuario);
        }
      }),
      catchError((error) => {
        console.error('❌ Erro HTTP retornado na chamada do login:', error);
        return throwError(() => new Error(error.error?.message || 'Email ou senha inválidos.'));
      })
    );
  }

  /**
   * Cadastra um novo usuário no Spring Boot
   */
  cadastrar(usuario: Usuario): Observable<Usuario> {
    console.log('📡 AuthService.cadastrar() chamado com:', usuario.email);

    const { id, ...dadosCadastro } = usuario;
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, dadosCadastro).pipe(
      tap((res) => console.log('✅ Cadastro realizado no backend:', res)),
      catchError((error) => {
        console.error('❌ Erro HTTP retornado no cadastro:', error);
        return throwError(() => new Error(error.error?.message || 'Erro ao cadastrar usuário.'));
      })
    );
  }

  /**
   * Limpa o token e os dados locais do localStorage e encerra a sessão
   */
  logout(): void {
    console.log('🚪 Efetuando logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Atualiza o estado local em memória (BehaviorSubject) e localStorage
   * sem precisar fazer nova requisição HTTP.
   */
  atualizarEstadoUsuarioLocal(dadosParciais: Partial<Usuario>): void {
    const usuarioAtual = this.currentUser;
    if (usuarioAtual) {
      const usuarioAtualizado = { ...usuarioAtual, ...dadosParciais };
      this.currentUserSubject.next(usuarioAtualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      console.log('🔄 Estado local do usuário atualizado:', usuarioAtualizado);
    }
  }

  /**
   * Atualiza o usuário atual no BehaviorSubject e no localStorage
   */
  setCurrentUser(usuario: Usuario | null): void {
    if (usuario) {
      this.currentUserSubject.next(usuario);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      console.log('🔄 setCurrentUser atualizado com:', usuario);
    } else {
      this.currentUserSubject.next(null);
      localStorage.removeItem('usuario');
      console.log('🔄 setCurrentUser removido (null)');
    }
  }

  /**
   * Busca os dados atualizados do perfil do usuário autenticado via API.
   * Se nenhum ID for fornecido, tenta usar o ID do usuário atualmente logado.
   */
  atualizarUsuario(id?: number): Observable<Usuario> {
    const usuarioId = id || this.currentUser?.id;

    if (!usuarioId) {
      console.warn('⚠️ Nenhum ID de usuário foi fornecido nem encontrado no estado atual.');
      return throwError(() => new Error('Usuário não autenticado ou ID ausente.'));
    }

    console.log(`📡 Buscando perfil atualizado para o ID: ${usuarioId}`);

    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${usuarioId}`).pipe(
      tap((usuario) => {
        console.log('✅ Perfil atualizado retornado da API:', usuario);
        this.currentUserSubject.next(usuario);
        localStorage.setItem('usuario', JSON.stringify(usuario));
      }),
      catchError((err) => {
        console.error('❌ Erro ao atualizar perfil do usuário:', err);
        return throwError(() => err);
      })
    );
  }
}