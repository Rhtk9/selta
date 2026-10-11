// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    component: LayoutComponent,
    //canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'explorar-especies',
        loadComponent: () => import('./pages/explorar-especies/explorar-especies.page').then(m => m.ExplorarEspeciesPage)
      },
      {
        path: 'cadastrar-especie',
        loadComponent: () => import('./pages/cadastrar-especie/cadastrar-especie.page').then(m => m.CadastrarEspeciePage)
      },
      {
        path: 'minhas-plantas',
        loadComponent: () => import('./pages/minhas-plantas/minhas-plantas.page').then(m => m.MinhasPlantasPage)
      },
      {
        path: 'turmas',
        loadComponent: () => import('./pages/turmas/turmas.page').then(m => m.TurmasPage)
      },
      {
        path: 'atividades/:turmaId',
        loadComponent: () => import('./pages/atividades/atividades.page').then(m => m.AtividadesPage)
      },
      {
        path: 'atividades',
        loadComponent: () => import('./pages/atividades/atividades.page').then(m => m.AtividadesPage)
      },
      {
        path: 'conteudos',
        loadComponent: () => import('./pages/conteudos/conteudos.page').then(m => m.ConteudosPage)
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./pages/relatorios/relatorios.page').then(m => m.RelatoriosPage)
      },
      {
        path: 'notificacoes',
        loadComponent: () => import('./pages/notificacoes/notificacoes.page').then(m => m.NotificacoesPage)
      },
      {
        path: 'compartilhar',
        loadComponent: () => import('./pages/compartilhar/compartilhar.page').then(m => m.CompartilharPage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
      },
      {
        path: 'cuidados-planta/:id',
        loadComponent: () => import('./pages/cuidados-planta/cuidados-planta.page').then(m => m.CuidadosPlantaPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];