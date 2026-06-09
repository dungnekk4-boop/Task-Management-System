package com.example.Task_Management_System.repository;

import com.example.Task_Management_System.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
