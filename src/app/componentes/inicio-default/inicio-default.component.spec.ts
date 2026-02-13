import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioDefaultComponent } from './inicio-default.component';

describe('InicioDefaultComponent', () => {
  let component: InicioDefaultComponent;
  let fixture: ComponentFixture<InicioDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioDefaultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
