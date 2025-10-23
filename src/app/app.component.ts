import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedService } from './core/service/shared.service';

@Component({
  selector: 'app-root',
  imports: [RouterModule,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'chatAI';
  sidebarClosed = false;
  toggleBtnRotated = false;

  constructor(private router: Router, private sharedService: SharedService) { }

  ngOnInit(): void {
    // console.log('AppComponent initialized with title:', this.title);
    // const generatedId = this.generateId();
    // console.log('Generated ID:', generatedId);
    // this.router.navigate(['chat', generatedId]);
  }

  toggleSidebar() {
    this.sidebarClosed = !this.sidebarClosed;
    this.toggleBtnRotated = !this.toggleBtnRotated;
    this.closeAllSubMenus();
  }

  closeAllSubMenus() {
    // Implement submenu closing logic if needed
  }

  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

}
