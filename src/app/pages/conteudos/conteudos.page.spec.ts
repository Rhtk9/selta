import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConteudosPage } from './conteudos.page';

describe('ConteudosPage', () => {
  let component: ConteudosPage;
  let fixture: ComponentFixture<ConteudosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConteudosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
